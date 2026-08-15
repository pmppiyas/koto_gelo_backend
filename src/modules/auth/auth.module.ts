import { Module } from '@nestjs/common';
import { AuthController } from '#app/modules/auth/auth.controller.js';
import { AuthService } from '#app/modules/auth/auth.service.js';
import { PasswordService } from '#app/modules/auth/services/password.service.js';
import { AccessTokenStrategy } from '#app/common/strategies/access-token.strategy.js';
import { RefreshTokenStrategy } from '#app/common/strategies/refresh-token.strategy.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { RefreshTokenGuard } from '#app/common/guard/refresh-token.guard.js';
import { UserModule } from '#app/modules/user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
  ],
  exports: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    AccessTokenGuard,
    RefreshTokenGuard,
  ],
})
export class AuthModule {}
