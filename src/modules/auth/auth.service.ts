import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignupInput } from '#app/modules/auth/schemas/signup.schema.js';
import { SignInInput } from '#app/modules/auth/schemas/signin.schema.js';
import { UserService } from '#app/modules/user/user.service.js';
import { PasswordService } from '#app/modules/auth/services/password.service.js';
import { TokenUtil } from '#app/common/utils/token.util.js';
import { PrismaService } from '#app/database/prisma.service.js';
import type { RefreshTokenPayload } from '#app/common/types/refresh-token-payload.type.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
  ) {}

  async signup(data: SignupInput) {
    const { password, ...rest } = data;

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.usersService.create({
      ...rest,
      passwordHash,
    });

    const tokens = TokenUtil.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async signin(data: SignInInput) {
    const user = await this.prisma.user.findUnique({
      where: { username: data.username },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordMatched = await this.passwordService.compare(
      data.password,
      user.password,
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = TokenUtil.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async refreshTokens(userPayload: RefreshTokenPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: userPayload.id },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const tokens = TokenUtil.generateTokens({
      id: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  async logout() {
    return null;
  }
}
