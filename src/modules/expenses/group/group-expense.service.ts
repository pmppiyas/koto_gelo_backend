import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';
import { RedisService } from '#app/cache/redis.service.js';
import {
  GroupExpenseCalculatorService,
  type CalculatedPayer,
  type CalculatedParticipant,
} from '#app/modules/expenses/group/group-expense-calculator.service.js';
import { CreateGroupExpenseInput } from '#app/modules/expenses/group/schemas/create-group-expense.schema.js';
import { UpdateGroupExpenseInput } from '#app/modules/expenses/group/schemas/update-group-expense.schema.js';
import { GroupExpenseQuery } from '#app/modules/expenses/group/schemas/group-expense-query.schema.js';
import { SettlePaymentInput } from '#app/modules/expenses/group/schemas/settle-expense.schema.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupExpenseService {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly calculatorService: GroupExpenseCalculatorService,
  ) {}

  private async invalidateGroupCache(groupId: string, expenseId?: string) {
    const promises: Promise<void>[] = [
      this.redis.deleteByPattern('group_expenses:*'),
      this.redis.deleteByPattern(`group_history:${groupId}:*`),
      this.redis.delete(`group_summary:${groupId}`),
      this.redis.delete(`group_balance:${groupId}`),
      this.redis.delete(`group_settlements:${groupId}`),
      this.redis.deleteByPattern('overall_summary:*'),
    ];

    if (expenseId) {
      promises.push(this.redis.delete(`group_expense:${expenseId}`));
    }

    await Promise.all(promises);
  }

  private async verifyGroupMembership(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const member = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!member && group.createdById !== userId) {
      throw new ForbiddenException(
        'You are not an active member of this group',
      );
    }

    return { group, member };
  }

  async create(userId: string, data: CreateGroupExpenseInput) {
    await this.verifyGroupMembership(userId, data.groupId);

    const activeMembers = await this.prisma.groupMember.findMany({
      where: {
        groupId: data.groupId,
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    const activeUserIds = new Set(activeMembers.map((m) => m.userId));

    if (data.payers) {
      for (const payer of data.payers) {
        if (!activeUserIds.has(payer.userId)) {
          throw new BadRequestException(
            `Payer with ID ${payer.userId} is not an active member of this group`,
          );
        }
      }
    }

    if (data.participants) {
      for (const part of data.participants) {
        if (!activeUserIds.has(part.userId)) {
          throw new BadRequestException(
            `Participant with ID ${part.userId} is not an active member of this group`,
          );
        }
      }
    }

    const payers = this.calculatorService.calculatePayers(
      data.amount,
      data.payers,
      userId,
    );

    const participants = this.calculatorService.calculateSplits(
      data.amount,
      data.splitType,
      data.participants,
      Array.from(activeUserIds),
    );

    const expense = await this.prisma.$transaction(async (tx) => {
      return tx.expense.create({
        data: {
          userId,
          groupId: data.groupId,
          type: 'GROUP',
          amount: data.amount,
          category: data.category,
          subcategory: data.subcategory,
          accountId: data.accountId,
          title: data.title,
          note: data.note,
          expenseDate: data.expenseDate,
          splitType: data.splitType,
          status: 'ACTIVE',
          payers: {
            createMany: {
              data: payers.map((p) => ({
                userId: p.userId,
                amount: p.amount,
              })),
            },
          },
          participants: {
            createMany: {
              data: participants.map((part) => ({
                userId: part.userId,
                shareAmount: part.shareAmount,
              })),
            },
          },
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          account: true,
          payers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    await this.invalidateGroupCache(data.groupId);

    return expense;
  }

  async findAll(userId: string, query: GroupExpenseQuery) {
    const userGroups = await this.prisma.groupMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: { groupId: true },
    });

    const userGroupIds = userGroups.map((g) => g.groupId);

    if (query.groupId) {
      if (!userGroupIds.includes(query.groupId)) {
        throw new ForbiddenException(
          'You are not a member of the requested group',
        );
      }
    }

    const cacheKey = `group_expenses:${userId}:${JSON.stringify(query)}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const {
      page,
      limit,
      groupId,
      category,
      subcategory,
      accountId,
      status,
      type,
      from,
      to,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
      groupId: groupId ? groupId : { in: userGroupIds },
      type: type ? (type as any) : { in: ['GROUP', 'SETTLEMENT'] },
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(accountId && { accountId }),
      ...(status && { status: status as any }),
      ...((from || to) && {
        expenseDate: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
          { subcategory: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, expenses] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          expenseDate: 'desc',
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          account: true,
          payers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const result = {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(userId: string, expenseId: string) {
    const cacheKey = `group_expense:${expenseId}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      await this.verifyGroupMembership(userId, cached.groupId);
      return cached;
    }

    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        account: true,
        payers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!expense || !expense.groupId) {
      throw new NotFoundException('Group expense not found');
    }

    await this.verifyGroupMembership(userId, expense.groupId);

    await this.redis.set(cacheKey, expense, this.CACHE_TTL);

    return expense;
  }

  async update(
    userId: string,
    expenseId: string,
    data: UpdateGroupExpenseInput,
  ) {
    const expense = await this.findOne(userId, expenseId);

    const isCreator = expense.userId === userId;
    const groupMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: expense.groupId!,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!isCreator && !groupMember) {
      throw new ForbiddenException(
        'Only the expense creator or group admin can update this expense',
      );
    }

    const needsRecalculation =
      data.amount !== undefined ||
      data.splitType !== undefined ||
      data.payers !== undefined ||
      data.participants !== undefined;

    const targetAmount =
      data.amount !== undefined ? data.amount : Number(expense.amount);
    const targetSplitType =
      data.splitType !== undefined
        ? data.splitType
        : expense.splitType || 'EQUAL';

    let payersToUpdate: CalculatedPayer[] | undefined = undefined;
    let participantsToUpdate: CalculatedParticipant[] | undefined = undefined;

    if (needsRecalculation) {
      const activeMembers = await this.prisma.groupMember.findMany({
        where: {
          groupId: expense.groupId!,
          status: 'ACTIVE',
        },
        select: { userId: true },
      });
      const activeUserIds = activeMembers.map((m) => m.userId);

      payersToUpdate = this.calculatorService.calculatePayers(
        targetAmount,
        data.payers ||
          expense.payers.map((p: any) => ({
            userId: p.userId,
            amount: Number(p.amount),
          })),
        expense.userId,
      );

      participantsToUpdate = this.calculatorService.calculateSplits(
        targetAmount,
        targetSplitType as any,
        data.participants ||
          expense.participants.map((p: any) => ({
            userId: p.userId,
            shareAmount: Number(p.shareAmount),
          })),
        activeUserIds,
      );
    }

    const updatedExpense = await this.prisma.$transaction(async (tx) => {
      if (needsRecalculation && payersToUpdate && participantsToUpdate) {
        await tx.expensePayer.deleteMany({ where: { expenseId } });
        await tx.expenseParticipant.deleteMany({ where: { expenseId } });

        await tx.expensePayer.createMany({
          data: payersToUpdate.map((p) => ({
            expenseId,
            userId: p.userId,
            amount: p.amount,
          })),
        });

        await tx.expenseParticipant.createMany({
          data: participantsToUpdate.map((part) => ({
            expenseId,
            userId: part.userId,
            shareAmount: part.shareAmount,
          })),
        });
      }

      return tx.expense.update({
        where: { id: expenseId },
        data: {
          ...(data.amount !== undefined && { amount: data.amount }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.subcategory !== undefined && {
            subcategory: data.subcategory,
          }),
          ...(data.accountId !== undefined && { accountId: data.accountId }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.note !== undefined && { note: data.note }),
          ...(data.expenseDate !== undefined && {
            expenseDate: data.expenseDate,
          }),
          ...(data.splitType !== undefined && { splitType: data.splitType }),
          ...(data.status !== undefined && { status: data.status as any }),
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          account: true,
          payers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    await this.invalidateGroupCache(expense.groupId!, expenseId);

    return updatedExpense;
  }

  async remove(userId: string, expenseId: string) {
    const expense = await this.findOne(userId, expenseId);

    const isCreator = expense.userId === userId;
    const groupMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: expense.groupId!,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!isCreator && !groupMember) {
      throw new ForbiddenException(
        'Only the expense creator or group admin can delete this expense',
      );
    }

    const cancelledExpense = await this.prisma.expense.update({
      where: { id: expenseId },
      data: {
        status: 'CANCELLED',
      },
    });

    await this.invalidateGroupCache(expense.groupId!, expenseId);

    return cancelledExpense;
  }

  async getOverallSummary(userId: string) {
    const cacheKey = `overall_summary:${userId}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const userGroups = await this.prisma.groupMember.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      select: { groupId: true },
    });

    const userGroupIds = userGroups.map((g) => g.groupId);

    const activeExpenses = await this.prisma.expense.findMany({
      where: {
        groupId: { in: userGroupIds },
        status: 'ACTIVE',
      },
      include: {
        payers: true,
        participants: true,
      },
    });

    let totalGroupExpenses = 0;
    let totalPaidByMe = 0;
    let totalMyShare = 0;

    for (const exp of activeExpenses) {
      totalGroupExpenses = Number(
        (totalGroupExpenses + Number(exp.amount)).toFixed(2),
      );

      for (const p of exp.payers) {
        if (p.userId === userId) {
          totalPaidByMe = Number((totalPaidByMe + Number(p.amount)).toFixed(2));
        }
      }

      for (const part of exp.participants) {
        if (part.userId === userId) {
          totalMyShare = Number(
            (totalMyShare + Number(part.shareAmount)).toFixed(2),
          );
        }
      }
    }

    const netBalance = Number((totalPaidByMe - totalMyShare).toFixed(2));

    const recentExpenses = await this.prisma.expense.findMany({
      where: {
        groupId: { in: userGroupIds },
      },
      take: 5,
      orderBy: {
        expenseDate: 'desc',
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const result = {
      totalGroupExpenses,
      totalPaidByMe,
      totalMyShare,
      netBalance,
      groupsCount: userGroupIds.length,
      recentExpenses,
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async getGroupSummary(userId: string, groupId: string) {
    const { group } = await this.verifyGroupMembership(userId, groupId);

    const cacheKey = `group_summary:${groupId}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const [activeExpenses, activeDeposits] = await Promise.all([
      this.prisma.expense.findMany({
        where: {
          groupId,
          status: 'ACTIVE',
        },
        include: {
          payers: true,
          participants: true,
        },
      }),
      this.prisma.groupDeposit.findMany({
        where: {
          groupId,
          status: 'ACTIVE',
        },
      }),
    ]);

    let totalExpense = 0;
    let totalDeposit = 0;
    let myTotalPaid = 0;
    let myTotalDeposited = 0;
    let myTotalShare = 0;
    const categoryMap = new Map<string, number>();

    for (const dep of activeDeposits) {
      const depAmount = Number(dep.amount);
      totalDeposit = Number((totalDeposit + depAmount).toFixed(2));
      if (dep.userId === userId) {
        myTotalDeposited = Number((myTotalDeposited + depAmount).toFixed(2));
      }
    }

    for (const exp of activeExpenses) {
      const expAmount = Number(exp.amount);
      totalExpense = Number((totalExpense + expAmount).toFixed(2));

      const catSum = categoryMap.get(exp.category) || 0;
      categoryMap.set(exp.category, Number((catSum + expAmount).toFixed(2)));

      for (const p of exp.payers) {
        if (p.userId === userId) {
          myTotalPaid = Number((myTotalPaid + Number(p.amount)).toFixed(2));
        }
      }

      for (const part of exp.participants) {
        if (part.userId === userId) {
          myTotalShare = Number(
            (myTotalShare + Number(part.shareAmount)).toFixed(2),
          );
        }
      }
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
      }),
    );

    const remainingFund = Number((totalDeposit - totalExpense).toFixed(2));
    const myTotalContributed = Number(
      (myTotalDeposited + myTotalPaid).toFixed(2),
    );
    const myNetBalance = Number((myTotalContributed - myTotalShare).toFixed(2));

    const result = {
      groupId: group.id,
      groupName: group.name,
      totalDeposit,
      totalExpense,
      remainingFund,
      totalExpenseCount: activeExpenses.length,
      totalDepositCount: activeDeposits.length,
      myTotalDeposited,
      myTotalPaid,
      myTotalContributed,
      myTotalShare,
      myNetBalance,
      categoryBreakdown,
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async getGroupBalance(userId: string, groupId: string) {
    await this.verifyGroupMembership(userId, groupId);

    const cacheKey = `group_balance:${groupId}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        status: 'ACTIVE',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const [activeExpenses, activeDeposits] = await Promise.all([
      this.prisma.expense.findMany({
        where: {
          groupId,
          status: 'ACTIVE',
        },
        include: {
          payers: true,
          participants: true,
        },
      }),
      this.prisma.groupDeposit.findMany({
        where: {
          groupId,
          status: 'ACTIVE',
        },
      }),
    ]);

    const memberList = members.map((m) => m.user);
    const balances = this.calculatorService.calculateMemberBalances(
      memberList,
      activeExpenses,
      activeDeposits,
    );

    const totalExpenses = activeExpenses.reduce(
      (sum, e) => sum + Number(e.amount),
      0,
    );
    const totalDeposits = activeDeposits.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );
    const remainingFund = Number((totalDeposits - totalExpenses).toFixed(2));

    const userBalance = balances.find((b) => b.userId === userId);

    const response = {
      totalExpenses: Number(totalExpenses.toFixed(2)),
      totalDeposits: Number(totalDeposits.toFixed(2)),
      remainingFund,
      totalMembers: members.length,
      yourDeposited: userBalance?.totalDeposited || 0,
      yourSpending: userBalance?.totalPaid || 0,
      yourShare: userBalance?.totalShare || 0,
      netBalance: userBalance?.netBalance || 0,
      balances,
    };

    await this.redis.set(cacheKey, response, this.CACHE_TTL);

    return response;
  }

  async getGroupSettlements(userId: string, groupId: string) {
    const cacheKey = `group_settlements:${groupId}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const balances = await this.getGroupBalance(userId, groupId);
    const settlements = this.calculatorService.calculateSettlements(balances);

    await this.redis.set(cacheKey, settlements, this.CACHE_TTL);

    return settlements;
  }

  async settlePayment(userId: string, data: SettlePaymentInput) {
    const targetGroupId = data.groupId;
    if (!targetGroupId) {
      throw new BadRequestException(
        'Group ID is required to record settlement',
      );
    }

    await this.verifyGroupMembership(userId, targetGroupId);

    const settlementExpense = await this.prisma.$transaction(async (tx) => {
      return tx.expense.create({
        data: {
          userId,
          groupId: targetGroupId,
          type: 'SETTLEMENT' as any,
          amount: data.amount,
          category: 'Settlement',
          title: data.note || 'Settlement Payment',
          note: data.note,
          expenseDate: data.expenseDate || new Date(),
          accountId: data.accountId,
          status: 'ACTIVE',
          payers: {
            create: {
              userId: data.payerId,
              amount: data.amount,
            },
          },
          participants: {
            create: {
              userId: data.receiverId,
              shareAmount: data.amount,
            },
          },
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          payers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });

    await this.invalidateGroupCache(targetGroupId);

    return settlementExpense;
  }

  async getGroupHistory(
    userId: string,
    groupId: string,
    query: GroupExpenseQuery,
  ) {
    await this.verifyGroupMembership(userId, groupId);

    const cacheKey = `group_history:${groupId}:${JSON.stringify(query)}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const { page, limit, category, status, type, from, to, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
      groupId,
      ...(category && { category }),
      ...(status && { status: status as any }),
      ...(type && { type: type as any }),
      ...((from || to) && {
        expenseDate: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { note: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, history] = await Promise.all([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          payers: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const result = {
      history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    await this.redis.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }
}
