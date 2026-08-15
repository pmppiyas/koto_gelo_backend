import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenUtil } from '#app/common/utils/token.util.js';
import type { RefreshTokenPayload } from '#app/common/types/refresh-token-payload.type.js';

@Injectable()
export class RefreshTokenStrategy {
  validate(token: string): RefreshTokenPayload {
    try {
      return TokenUtil.verifyRefreshToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
