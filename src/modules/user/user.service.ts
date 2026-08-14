import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '#app/database/prisma.service.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: {
        username,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(data: {
    username: string;
    email?: string;
    phone?: string;
    passwordHash: string;
  }) {
    return this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.passwordHash,
      },
    });
  }
}
