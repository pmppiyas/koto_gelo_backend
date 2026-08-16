import { Injectable } from '@nestjs/common';
import { PersonalExpenseService } from '#app/modules/expenses/personal/personal-expense.service.js';
import { GroupExpenseService } from '#app/modules/expenses/group/group-expense.service.js';
import { CreatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/create-personal-expense.schema.js';
import { UpdatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/update-personal-expense.schema.js';
import { PersonalExpenseQuery } from '#app/modules/expenses/personal/schemas/expense-query.schema.js';
import { CreateGroupExpenseInput } from '#app/modules/expenses/group/schemas/create-group-expense.schema.js';
import { UpdateGroupExpenseInput } from '#app/modules/expenses/group/schemas/update-group-expense.schema.js';
import { GroupExpenseQuery } from '#app/modules/expenses/group/schemas/group-expense-query.schema.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly personalExpenseService: PersonalExpenseService,
    private readonly groupExpenseService: GroupExpenseService,
  ) {}

  // Personal Expenses
  async createPersonalExpense(
    userId: string,
    data: CreatePersonalExpenseInput,
  ) {
    return this.personalExpenseService.create(userId, data);
  }

  async findAllPersonalExpenses(userId: string, query: PersonalExpenseQuery) {
    return this.personalExpenseService.findAll(userId, query);
  }

  async findPersonalExpenseById(userId: string, id: string) {
    return this.personalExpenseService.findOne(userId, id);
  }

  async updatePersonalExpense(
    userId: string,
    id: string,
    data: UpdatePersonalExpenseInput,
  ) {
    return this.personalExpenseService.update(userId, id, data);
  }

  async removePersonalExpense(userId: string, id: string) {
    return this.personalExpenseService.remove(userId, id);
  }

  // Group Expenses
  async createGroupExpense(userId: string, data: CreateGroupExpenseInput) {
    return this.groupExpenseService.create(userId, data);
  }

  async findAllGroupExpenses(userId: string, query: GroupExpenseQuery) {
    return this.groupExpenseService.findAll(userId, query);
  }

  async findGroupExpenseById(userId: string, id: string) {
    return this.groupExpenseService.findOne(userId, id);
  }

  async updateGroupExpense(
    userId: string,
    id: string,
    data: UpdateGroupExpenseInput,
  ) {
    return this.groupExpenseService.update(userId, id, data);
  }

  async removeGroupExpense(userId: string, id: string) {
    return this.groupExpenseService.remove(userId, id);
  }
}
