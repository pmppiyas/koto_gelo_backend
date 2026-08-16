import { Controller, Get, UseGuards } from '@nestjs/common';
import { ExpensesService } from '#app/modules/expenses/expenses.service.js';
import { GroupExpenseService } from '#app/modules/expenses/group/group-expense.service.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller('expenses')
@UseGuards(AccessTokenGuard)
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly groupExpenseService: GroupExpenseService,
  ) {}

  @Get('summary')
  async getSummary(@CurrentUser() user: AccessTokenPayload) {
    const groupSummary = await this.groupExpenseService.getOverallSummary(
      user.id,
    );

    return {
      success: true,
      message: 'Overall expenses summary retrieved successfull!',
      data: {
        groupSummary,
      },
    };
  }
}
