import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';
import { RedisService } from '#app/cache/redis.service.js';
import { CreateGroupDepositInput } from './schemas/create-group-deposit.schema.js';
import { UpdateGroupDepositInput } from './schemas/update-group-deposit.schema.js';
import { GroupDepositQuery } from './schemas/group-deposit-query.schema.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupDepositService {
  private readonly CACHE_TTL = 300;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async invalidateDepositCache(groupId: string) {
    const promises: Promise<void>[] = [
      this.redis.deleteByPattern(`group_deposits:*`),
      this.redis.delete(`group_summary:${groupId}`),
      this.redis.delete(`group_balance:${groupId}`),
      this.redis.delete(`group_settlements:${groupId}`),
      this.redis.deleteByPattern('overall_summary:*'),
    ];
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

  async create(recordedById: string, data: CreateGroupDepositInput) {
    await this.verifyGroupMembership(recordedById, data.groupId);

    const targetMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: data.groupId,
        userId: data.userId,
        status: 'ACTIVE',
      },
    });

    if (!targetMember) {
      throw new BadRequestException(
        'The specified user is not an active member of this group',
      );
    }

    const deposit = await this.prisma.groupDeposit.create({
      data: {
        groupId: data.groupId,
        userId: data.userId,
        recordedById,
        amount: data.amount,
        depositDate: data.depositDate,
        method: data.method as any,
        note: data.note,
        status: 'ACTIVE',
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
        recordedBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    await this.invalidateDepositCache(data.groupId);
    return deposit;
  }

  async findAll(userId: string, query: GroupDepositQuery) {
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

    const {
      page,
      limit,
      groupId,
      userId: memberUserId,
      method,
      status = 'ACTIVE',
      from,
      to,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupDepositWhereInput = {
      groupId: groupId ? groupId : { in: userGroupIds },
      ...(memberUserId && { userId: memberUserId }),
      ...(method && { method: method as any }),
      ...(status && { status: status as any }),
      ...((from || to) && {
        depositDate: {
          ...(from && { gte: from }),
          ...(to && { lte: to }),
        },
      }),
      ...(search && {
        OR: [
          { note: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { username: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const [total, deposits] = await Promise.all([
      this.prisma.groupDeposit.count({ where }),
      this.prisma.groupDeposit.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          depositDate: 'desc',
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
          recordedBy: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const totalAmount = deposits.reduce((acc, d) => acc + Number(d.amount), 0);

    return {
      deposits,
      totalAmount: Number(totalAmount.toFixed(2)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, depositId: string) {
    const deposit = await this.prisma.groupDeposit.findUnique({
      where: { id: depositId },
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
        recordedBy: {
          select: {
            id: true,
            username: true,
            name: true,
          },
        },
      },
    });

    if (!deposit) {
      throw new NotFoundException('Deposit record not found');
    }

    await this.verifyGroupMembership(userId, deposit.groupId);
    return deposit;
  }

  async update(
    userId: string,
    depositId: string,
    data: UpdateGroupDepositInput,
  ) {
    const deposit = await this.findOne(userId, depositId);

    const isRecorder = deposit.recordedById === userId;
    const groupMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: deposit.groupId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!isRecorder && !groupMember) {
      throw new ForbiddenException(
        'Only the recorder or group admin can update this deposit',
      );
    }

    const updatedDeposit = await this.prisma.groupDeposit.update({
      where: { id: depositId },
      data: {
        ...(data.userId !== undefined && { userId: data.userId }),
        ...(data.amount !== undefined && { amount: data.amount }),
        ...(data.depositDate !== undefined && {
          depositDate: data.depositDate,
        }),
        ...(data.method !== undefined && { method: data.method as any }),
        ...(data.note !== undefined && { note: data.note }),
        ...(data.status !== undefined && { status: data.status as any }),
      },
      include: {
        group: true,
        user: true,
        recordedBy: true,
      },
    });

    await this.invalidateDepositCache(deposit.groupId);
    return updatedDeposit;
  }

  async remove(userId: string, depositId: string) {
    const deposit = await this.findOne(userId, depositId);

    const isRecorder = deposit.recordedById === userId;
    const groupMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: deposit.groupId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!isRecorder && !groupMember) {
      throw new ForbiddenException(
        'Only the recorder or group admin can delete this deposit',
      );
    }

    const cancelledDeposit = await this.prisma.groupDeposit.update({
      where: { id: depositId },
      data: {
        status: 'CANCELLED',
      },
    });

    await this.invalidateDepositCache(deposit.groupId);
    return cancelledDeposit;
  }

  async getGroupDepositSummary(userId: string, groupId: string) {
    await this.verifyGroupMembership(userId, groupId);

    const activeDeposits = await this.prisma.groupDeposit.findMany({
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

    const memberMap = new Map<
      string,
      { user: any; totalDeposited: number; count: number }
    >();

    let totalGroupDeposit = 0;

    for (const dep of activeDeposits) {
      const amt = Number(dep.amount);
      totalGroupDeposit = Number((totalGroupDeposit + amt).toFixed(2));

      const current = memberMap.get(dep.userId) || {
        user: dep.user,
        totalDeposited: 0,
        count: 0,
      };
      current.totalDeposited = Number(
        (current.totalDeposited + amt).toFixed(2),
      );
      current.count += 1;
      memberMap.set(dep.userId, current);
    }

    return {
      groupId,
      totalGroupDeposit,
      memberSummaries: Array.from(memberMap.values()),
    };
  }
}
