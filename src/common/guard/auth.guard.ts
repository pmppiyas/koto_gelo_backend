import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtTokenService } from '#app/modules/auth/services/jwtToken.service.js';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtTokenService: JwtTokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Access token is missing or invalid');
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload = this.jwtTokenService.verifyAccessToken(token);
      request.user = payload;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
