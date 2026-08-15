import { env } from '#app/common/config/env.config.js';
import {
  AuthTokens,
  JwtPayload,
} from '#app/common/interface/auth.interfcae.js';
import { Injectable } from '@nestjs/common';
import jwt from 'jsonwebtoken';

@Injectable()
export class JwtTokenService {
  private readonly accessSecret = env.JWT_ACCESS_SECRET;
  private readonly refreshSecret = env.JWT_REFRESS_SECRET;

  generateTokens(payload: JwtPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.accessSecret, {
      algorithm: 'HS256',
      expiresIn: '5h',
    });

    const refreshToken = jwt.sign(payload, this.refreshSecret, {
      algorithm: 'HS256',
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, this.accessSecret) as JwtPayload;
  }

  verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, this.refreshSecret) as JwtPayload;
  }
}
