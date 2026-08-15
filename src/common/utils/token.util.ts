import { env } from '#app/common/config/env.config.js';
import jwt from 'jsonwebtoken';
import type {
  AccessTokenPayload,
  AuthTokens,
} from '#app/common/types/access-token-payload.type.js';
import type { RefreshTokenPayload } from '#app/common/types/refresh-token-payload.type.js';

export class TokenUtil {
  static generateTokens(payload: AccessTokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '5h',
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESS_SECRET, {
      algorithm: 'HS256',
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.JWT_REFRESS_SECRET) as RefreshTokenPayload;
  }
}
