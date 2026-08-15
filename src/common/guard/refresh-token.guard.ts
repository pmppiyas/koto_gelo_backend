import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenStrategy } from '#app/common/strategies/refresh-token.strategy.js';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly refreshTokenStrategy: RefreshTokenStrategy) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    let token: string | undefined;

    if (request.body?.refreshToken) {
      token = request.body.refreshToken;
    } else if (request.headers.authorization?.startsWith('Bearer ')) {
      token = request.headers.authorization.split(' ')[1];
    } else if (request.cookies?.refresh_token) {
      token = request.cookies.refresh_token;
    }

    if (!token) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const payload = this.refreshTokenStrategy.validate(token);
    request.user = { ...payload, refreshToken: token };

    return true;
  }
}
