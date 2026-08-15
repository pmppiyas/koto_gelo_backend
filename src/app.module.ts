import { AppController } from '#app/app.controller.js';
import { AppService } from '#app/app.service.js';
import { DatabaseModule } from '#app/database/database.module.js';
import { AuthModule } from '#app/modules/auth/auth.module.js';
import { UserModule } from '#app/modules/user/user.module.js';
import { ExpensesModule } from '#app/modules/expenses/expenses.module.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [UserModule, AuthModule, ExpensesModule, DatabaseModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
