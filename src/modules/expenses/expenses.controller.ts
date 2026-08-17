import { Controller, Get, UseGuards } from '@nestjs/common';
import { GroupExpenseService } from '#app/modules/expenses/group/group-expense.service.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller({
  path: 'expenses',
  version: '1',
})
@UseGuards(AccessTokenGuard)
export class ExpensesController {
  constructor(private readonly groupExpenseService: GroupExpenseService) {}

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
