import { Module } from '@nestjs/common';
import { ExpensesController } from '#app/modules/expenses/expenses.controller.js';
import { PersonalExpenseController } from '#app/modules/expenses/personal/personal-expense.controller.js';
import { GroupExpenseController } from '#app/modules/expenses/group/group-expense.controller.js';
import { ExpensesService } from '#app/modules/expenses/expenses.service.js';
import { PersonalExpenseService } from '#app/modules/expenses/personal/personal-expense.service.js';
import { GroupExpenseService } from '#app/modules/expenses/group/group-expense.service.js';
import { GroupExpenseCalculatorService } from '#app/modules/expenses/group/group-expense-calculator.service.js';
import { AuthModule } from '#app/modules/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    ExpensesController,
    PersonalExpenseController,
    GroupExpenseController,
  ],
  providers: [
    ExpensesService,
    PersonalExpenseService,
    GroupExpenseService,
    GroupExpenseCalculatorService,
  ],
  exports: [
    ExpensesService,
    PersonalExpenseService,
    GroupExpenseService,
    GroupExpenseCalculatorService,
  ],
})
export class ExpensesModule {}
