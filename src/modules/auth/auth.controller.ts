import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '#app/modules/auth/auth.service.js';
import {
  type SignupInput,
  signupSchema,
} from '#app/modules/auth/schemas/signup.schema.js';
import {
  type SignInInput,
  signInSchema,
} from '#app/modules/auth/schemas/signin.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';
import { RefreshTokenGuard } from '#app/common/guard/refresh-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { RefreshTokenPayload } from '#app/common/types/refresh-token-payload.type.js';

const ACCESS_TOKEN_COOKIE = 'access_token';
const REFRESH_TOKEN_COOKIE = 'refresh_token';

const ACCESS_TOKEN_MAX_AGE = 5 * 60 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setTokenCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  private clearTokenCookies(res: Response) {
    res.clearCookie(ACCESS_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
    });

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
    });
  }

  @Post('signup')
  async signup(
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidation(signupSchema)) body: SignupInput,
  ) {
    const result = await this.authService.signup(body);

    this.setTokenCookies(res, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: 'Signup successfull!',
      data: result,
    };
  }

  @Post('signin')
  async signin(
    @Res({ passthrough: true }) res: Response,
    @Body(new ZodValidation(signInSchema)) body: SignInInput,
  ) {
    const result = await this.authService.signin(body);

    this.setTokenCookies(res, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: 'Signin successfull!',
      data: result,
    };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout();

    this.clearTokenCookies(res);

    return {
      success: true,
      message: 'Logout successfull!',
      data: result,
    };
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: RefreshTokenPayload,
  ) {
    const result = await this.authService.refreshTokens(user);

    this.setTokenCookies(res, result.accessToken, result.refreshToken);

    return {
      success: true,
      message: 'Token refreshed successfull!',
      data: result,
    };
  }
}
