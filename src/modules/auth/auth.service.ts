import { SignupInput } from '#app/modules/auth/schemas/signup.schema.js';
import { UserService } from '#app/modules/user/user.service.js';
import { PasswordService } from '#app/modules/auth/services/password.service.js';
import { ConflictException, Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly passwordService: PasswordService,
  ) {}

  async signup(data: SignupInput) {
    const existingUser = await this.usersService.findByUsername(data.username);

    if (existingUser) {
      throw new ConflictException('Username is already taken');
    }

    const passwordHash = await this.passwordService.hash(data.password);

    const user = await this.usersService.create({
      username: data.username,
      email: data.email,
      phone: data.phone,
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
