import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AccessTokenStrategy } from '#app/common/strategies/access-token.strategy.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly accessTokenStrategy: AccessTokenStrategy) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    let token: string | undefined;

    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (request.cookies?.access_token) {
      token = request.cookies.access_token;
    }

    if (!token) {
      throw new UnauthorizedException('Access token is missing or invalid');
    }

    const payload = this.accessTokenStrategy.validate(token);
    request.user = payload;

    return true;
  }
}
