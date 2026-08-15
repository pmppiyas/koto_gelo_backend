import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from '#app/modules/expenses/expenses.service.js';
import {
  type CreatePersonalExpenseInput,
  createPersonalExpenseSchema,
} from '#app/modules/expenses/personal/schemas/create-personal-expense.schema.js';
import {
  type UpdatePersonalExpenseInput,
  updatePersonalExpenseSchema,
} from '#app/modules/expenses/personal/schemas/update-personal-expense.schema.js';
import {
  type PersonalExpenseQuery,
  personalExpenseQuerySchema,
} from '#app/modules/expenses/personal/schemas/expense-query.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller('expenses/personal')
@UseGuards(AccessTokenGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidation(createPersonalExpenseSchema))
    body: CreatePersonalExpenseInput,
  ) {
    const result = await this.expensesService.createPersonalExpense(
      user.id,
      body,
    );

    return {
      success: true,
      message: 'Expense created successfull!',
      data: result,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidation(personalExpenseQuerySchema))
    query: PersonalExpenseQuery,
  ) {
    const result = await this.expensesService.findAllPersonalExpenses(
      user.id,
      query,
    );

    return {
      success: true,
      message: 'Expenses retrieved successfull!',
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const result = await this.expensesService.findPersonalExpenseById(
      user.id,
      id,
    );

    return {
      success: true,
      message: 'Expense retrieved successfull!',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body(new ZodValidation(updatePersonalExpenseSchema))
    body: UpdatePersonalExpenseInput,
  ) {
    const result = await this.expensesService.updatePersonalExpense(
      user.id,
      id,
      body,
    );

    return {
      success: true,
      message: 'Expense updated successfull!',
      data: result,
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const result = await this.expensesService.removePersonalExpense(
      user.id,
      id,
    );

    return {
      success: true,
      message: 'Expense deleted successfull!',
      data: result,
    };
  }
}
