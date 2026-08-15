import { Injectable } from '@nestjs/common';
import { PersonalExpenseService } from '#app/modules/expenses/personal/personal-expense.service.js';
import { CreatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/create-personal-expense.schema.js';
import { UpdatePersonalExpenseInput } from '#app/modules/expenses/personal/schemas/update-personal-expense.schema.js';
import { PersonalExpenseQuery } from '#app/modules/expenses/personal/schemas/expense-query.schema.js';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly personalExpenseService: PersonalExpenseService,
  ) {}

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
}
