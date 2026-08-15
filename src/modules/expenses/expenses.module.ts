import { Module } from '@nestjs/common';
import { ExpensesController } from '#app/modules/expenses/expenses.controller.js';
import { ExpensesService } from '#app/modules/expenses/expenses.service.js';
import { PersonalExpenseService } from '#app/modules/expenses/personal/personal-expense.service.js';
import { AuthModule } from '#app/modules/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, PersonalExpenseService],
  exports: [ExpensesService, PersonalExpenseService],
})
export class ExpensesModule {}
