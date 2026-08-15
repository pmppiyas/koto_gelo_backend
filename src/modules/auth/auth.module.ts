import { Module } from '@nestjs/common';

import { AuthController } from '#app/modules/auth/auth.controller.js';
import { AuthService } from '#app/modules/auth/auth.service.js';
import { PasswordService } from '#app/modules/auth/services/password.service.js';
import { JwtTokenService } from '#app/modules/auth/services/jwtToken.service.js';
import { UserModule } from '#app/modules/user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtTokenService],
  exports: [JwtTokenService],
})
export class AuthModule {}
