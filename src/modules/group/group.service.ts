import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';
import { CreateGroupInput } from '#app/modules/group/schemas/create-group.schema.js';
import { UpdateGroupInput } from '#app/modules/group/schemas/update-group.schema.js';
import { GroupQuery } from '#app/modules/group/schemas/group-query.schema.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class GroupService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: CreateGroupInput) {
    return this.prisma.group.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        createdById: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(userId: string, query: GroupQuery) {
    const { page, limit, type, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupWhereInput = {
      OR: [
        { createdById: userId },
        { members: { some: { userId, status: 'ACTIVE' } } },
      ],
      ...(type && { type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [total, groups] = await Promise.all([
      this.prisma.group.count({ where }),
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
              expenses: true,
            },
          },
        },
      }),
    ]);

    return {
      groups,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { createdById: userId },
          { members: { some: { userId, status: 'ACTIVE' } } },
        ],
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            expenses: true,
            members: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  async update(userId: string, groupId: string, data: UpdateGroupInput) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        OR: [
          { createdById: userId },
          {
            members: {
              some: {
                userId,
                role: { in: ['OWNER', 'ADMIN'] },
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async remove(userId: string, groupId: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        createdById: userId,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return this.prisma.group.delete({
      where: { id: groupId },
    });
  }
}
