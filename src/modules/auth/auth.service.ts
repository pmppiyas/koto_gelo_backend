import { SignupInput } from '#app/modules/auth/schemas/signup.schema.js';
import { UserService } from '#app/modules/user/user.service.js';
import { PasswordService } from '#app/modules/auth/services/password.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly passwordService: PasswordService,
  ) {}

  async signup(data: SignupInput) {
    const { password, ...rest } = data;

    const passwordHash = await this.passwordService.hash(password);

    const user = await this.usersService.create({
      ...rest,
      passwordHash,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }
}
