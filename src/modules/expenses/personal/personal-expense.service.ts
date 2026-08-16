import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';
import { RedisService } from '#app/cache/redis.service.js';
import { CreatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/create-personal-expense.schema.js';
import { UpdatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/update-personal-expense.schema.js';
import { PersonalExpenseQuery } from '#app/modules/expenses/personal/schemas/expense-query.schema.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PersonalExpenseService {
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async invalidateUserCache(userId: string, expenseId?: string) {
    const promises: Promise<void>[] = [
      this.redis.deleteByPattern(`personal_expenses:${userId}:*`),
      this.redis.deleteByPattern(`expenses_summary:${userId}:*`),
    ];

    if (expenseId) {
      promises.push(
        this.redis.delete(`personal_expense:${userId}:${expenseId}`),
      );
    }

    await Promise.all(promises);
  }

  async create(userId: string, data: CreatePersonalExpenseInput) {
    const expense = await this.prisma.expense.create({
      data: {
        userId,
        type: 'PERSONAL',
        amount: data.amount,
        category: data.category,
        subcategory: data.subcategory,
        accountId: data.accountId,
        title: data.title,
        note: data.note,
        expenseDate: data.expenseDate,
      },
      include: {
        account: true,
      },
    });

    await this.invalidateUserCache(userId);

    return expense;
  }

  async findAll(userId: string, query: PersonalExpenseQuery) {
    const cacheKey = `personal_expenses:${userId}:${JSON.stringify(query)}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const {
      page,
      limit,
      category,
      subcategory,
      accountId,
      status,
      from,
      to,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {
      userId,
      type: 'PERSONAL',
      ...(category && { category }),
      ...(subcategory && { subcategory }),
      ...(accountId && { accountId }),
      ...(status && { status }),
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
          account: true,
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

  async findOne(userId: string, id: string) {
    const cacheKey = `personal_expense:${userId}:${id}`;
    const cached = await this.redis.get<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        userId,
        type: 'PERSONAL',
      },
      include: {
        account: true,
      },
    });

    if (!expense) {
      throw new NotFoundException('Expense not found');
    }

    await this.redis.set(cacheKey, expense, this.CACHE_TTL);

    return expense;
  }

  async update(userId: string, id: string, data: UpdatePersonalExpenseInput) {
    await this.findOne(userId, id);

    const updatedExpense = await this.prisma.expense.update({
      where: { id },
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
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        account: true,
      },
    });

    await this.invalidateUserCache(userId, id);

    return updatedExpense;
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    const deleted = await this.prisma.expense.delete({
      where: { id },
    });

    await this.invalidateUserCache(userId, id);

    return deleted;
  }
}
