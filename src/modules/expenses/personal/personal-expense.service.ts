import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';
import { CreatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/create-personal-expense.schema.js';
import { UpdatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/update-personal-expense.schema.js';
import { PersonalExpenseQuery } from '#app/modules/expenses/personal/schemas/expense-query.schema.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class PersonalExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreatePersonalExpenseInput) {
    return this.prisma.expense.create({
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
  }

  async findAll(userId: string, query: PersonalExpenseQuery) {
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

    return {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
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

    return expense;
  }

  async update(userId: string, id: string, data: UpdatePersonalExpenseInput) {
    await this.findOne(userId, id);

    return this.prisma.expense.update({
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
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    return this.prisma.expense.delete({
      where: { id },
    });
  }
}
