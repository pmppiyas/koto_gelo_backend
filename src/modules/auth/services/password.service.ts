import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { env } from '#app/common/config/env.config.js';

@Injectable()
export class PasswordService {
  private readonly saltRounds = env.PASSWORD_SALT_ROUNDS;

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  async compare(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
