import { SignupInput } from '#app/modules/auth/schemas/signup.schema.js';
import { SignInInput } from '#app/modules/auth/schemas/signin.schema.js';
import { UserService } from '#app/modules/user/user.service.js';
import { PasswordService } from '#app/modules/auth/services/password.service.js';
import { JwtTokenService } from '#app/modules/auth/services/jwtToken.service.js';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtTokenService: JwtTokenService,
    private readonly prisma: PrismaService,
  ) {}

  async signup(data: SignupInput) {
    const { password, ...rest } = data;

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.usersService.create({
      ...rest,
      passwordHash,
    });

    const tokens = this.jwtTokenService.generateTokens({
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
      where: {
        username: data.username,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password: _, ...result } = user;

    const isPasswordMatched = await this.passwordService.compare(
      data.password,
      user.password,
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid password');
    }

    const tokens = this.jwtTokenService.generateTokens({
      id: user.id,
      username: user.username,
      email: user?.email,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
