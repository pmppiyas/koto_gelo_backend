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
import { GroupExpenseService } from '#app/modules/expenses/group/group-expense.service.js';
import {
  type CreateGroupExpenseInput,
  createGroupExpenseSchema,
} from '#app/modules/expenses/group/schemas/create-group-expense.schema.js';
import {
  type UpdateGroupExpenseInput,
  updateGroupExpenseSchema,
} from '#app/modules/expenses/group/schemas/update-group-expense.schema.js';
import {
  type GroupExpenseQuery,
  groupExpenseQuerySchema,
} from '#app/modules/expenses/group/schemas/group-expense-query.schema.js';
import {
  type SettlePaymentInput,
  settlePaymentSchema,
} from '#app/modules/expenses/group/schemas/settle-expense.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller('group/expenses')
@UseGuards(AccessTokenGuard)
export class GroupExpenseController {
  constructor(private readonly groupExpenseService: GroupExpenseService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidation(createGroupExpenseSchema))
    body: CreateGroupExpenseInput,
  ) {
    const result = await this.groupExpenseService.create(user.id, body);

    return {
      success: true,
      message: 'Group expense created successfull!',
      data: result,
    };
  }

  @Get('summary')
  async getOverallSummary(@CurrentUser() user: AccessTokenPayload) {
    const result = await this.groupExpenseService.getOverallSummary(user.id);

    return {
      success: true,
      message: 'Group expenses summary retrieved successfull!',
      data: result,
    };
  }

  @Post('settle')
  async settlePayment(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidation(settlePaymentSchema))
    body: SettlePaymentInput,
  ) {
    const result = await this.groupExpenseService.settlePayment(user.id, body);

    return {
      success: true,
      message: 'Settlement recorded successfull!',
      data: result,
    };
  }

  @Post(':expenseId/settle')
  async settleExpense(
    @CurrentUser() user: AccessTokenPayload,
    @Param('expenseId') expenseId: string,
    @Body(new ZodValidation(settlePaymentSchema))
    body: SettlePaymentInput,
  ) {
    const result = await this.groupExpenseService.settlePayment(user.id, {
      ...body,
      note: body.note || `Settled for expense ${expenseId}`,
    });

    return {
      success: true,
      message: 'Expense settlement recorded successfull!',
      data: result,
    };
  }

  @Get(':groupId/summary')
  async getGroupSummary(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.groupExpenseService.getGroupSummary(
      user.id,
      groupId,
    );

    return {
      success: true,
      message: 'Group summary retrieved successfull!',
      data: result,
    };
  }

  @Get(':groupId/balance')
  async getGroupBalance(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.groupExpenseService.getGroupBalance(
      user.id,
      groupId,
    );

    return {
      success: true,
      message: 'Group balance retrieved successfull!',
      data: result,
    };
  }

  @Get(':groupId/settlements')
  async getGroupSettlements(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.groupExpenseService.getGroupSettlements(
      user.id,
      groupId,
    );

    return {
      success: true,
      message: 'Group settlements calculated successfull!',
      data: result,
    };
  }

  @Get(':groupId/history')
  async getGroupHistory(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Query(new ZodValidation(groupExpenseQuerySchema))
    query: GroupExpenseQuery,
  ) {
    const result = await this.groupExpenseService.getGroupHistory(
      user.id,
      groupId,
      query,
    );

    return {
      success: true,
      message: 'Group history retrieved successfull!',
      data: result,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidation(groupExpenseQuerySchema))
    query: GroupExpenseQuery,
  ) {
    const result = await this.groupExpenseService.findAll(user.id, query);

    return {
      success: true,
      message: 'Group expenses retrieved successfull!',
      data: result,
    };
  }

  @Get(':expenseId')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('expenseId') expenseId: string,
  ) {
    const result = await this.groupExpenseService.findOne(user.id, expenseId);

    return {
      success: true,
      message: 'Group expense retrieved successfull!',
      data: result,
    };
  }

  @Patch(':expenseId')
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('expenseId') expenseId: string,
    @Body(new ZodValidation(updateGroupExpenseSchema))
    body: UpdateGroupExpenseInput,
  ) {
    const result = await this.groupExpenseService.update(
      user.id,
      expenseId,
      body,
    );

    return {
      success: true,
      message: 'Group expense updated successfull!',
      data: result,
    };
  }

  @Delete(':expenseId')
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('expenseId') expenseId: string,
  ) {
    const result = await this.groupExpenseService.remove(user.id, expenseId);

    return {
      success: true,
      message: 'Group expense deleted successfull!',
      data: result,
    };
  }
}
