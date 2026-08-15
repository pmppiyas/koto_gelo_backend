import { Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenUtil } from '#app/common/utils/token.util.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Injectable()
export class AccessTokenStrategy {
  validate(token: string): AccessTokenPayload {
    try {
      return TokenUtil.verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}
