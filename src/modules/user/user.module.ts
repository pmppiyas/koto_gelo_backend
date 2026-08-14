import { UserController } from '#app/modules/user/user.controller.js';
import { UserService } from '#app/modules/user/user.service.js';
import { Module } from '@nestjs/common';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
