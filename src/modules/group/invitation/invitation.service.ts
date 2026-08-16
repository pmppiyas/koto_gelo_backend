import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '#app/database/prisma.service.js';
import { CreateInvitationInput } from '#app/modules/group/invitation/schemas/create-invitation.schema.js';
import { InvitationQuery } from '#app/modules/group/invitation/schemas/invitation-query.schema.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class InvitationService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvitation(
    userId: string,
    groupId: string,
    data: CreateInvitationInput,
  ) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const inviterMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (!inviterMember) {
      throw new ForbiddenException(
        'Only active group members can send invitations',
      );
    }

    const invitee = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(data.inviteeId ? [{ id: data.inviteeId }] : []),
          ...(data.username ? [{ username: data.username }] : []),
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });

    if (!invitee) {
      throw new NotFoundException('User to invite not found');
    }

    const existingMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: invitee.id,
        status: 'ACTIVE',
      },
    });

    if (existingMember) {
      throw new BadRequestException('User is already a member of this group');
    }

    const existingPending = await this.prisma.groupInvitation.findFirst({
      where: {
        groupId,
        inviteeId: invitee.id,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'An active invitation or request already exists for this user',
      );
    }

    return this.prisma.groupInvitation.create({
      data: {
        groupId,
        invitedById: userId,
        inviteeId: invitee.id,
        type: 'INVITATION',
        status: 'PENDING',
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        invitee: {
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

  async createJoinRequest(userId: string, groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const existingMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    if (existingMember) {
      throw new BadRequestException('You are already a member of this group');
    }

    const existingPending = await this.prisma.groupInvitation.findFirst({
      where: {
        groupId,
        inviteeId: userId,
        status: 'PENDING',
      },
    });

    if (existingPending) {
      throw new BadRequestException(
        'You already have a pending invitation or join request for this group',
      );
    }

    return this.prisma.groupInvitation.create({
      data: {
        groupId,
        invitedById: userId,
        inviteeId: userId,
        type: 'JOIN_REQUEST',
        status: 'PENDING',
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        invitee: {
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

  async findAll(userId: string, groupId: string, query: InvitationQuery) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const userMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        status: 'ACTIVE',
      },
    });

    const isOwnerOrAdmin =
      group.createdById === userId ||
      (userMember && ['OWNER', 'ADMIN'].includes(userMember.role));

    const { page, limit, status, type } = query;
    const skip = (page - 1) * limit;

    let permissionFilter: Prisma.GroupInvitationWhereInput = {};
    if (!isOwnerOrAdmin) {
      if (userMember) {
        permissionFilter = {
          OR: [{ invitedById: userId }, { inviteeId: userId }],
        };
      } else {
        permissionFilter = {
          inviteeId: userId,
        };
      }
    }

    const where: Prisma.GroupInvitationWhereInput = {
      groupId,
      ...permissionFilter,
      ...(status && { status }),
      ...(type && { type }),
    };

    const [total, invitations] = await Promise.all([
      this.prisma.groupInvitation.count({ where }),
      this.prisma.groupInvitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          invitee: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      invitations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findMyInvitations(userId: string, query: InvitationQuery) {
    const { page, limit, status, type } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GroupInvitationWhereInput = {
      OR: [{ inviteeId: userId }, { invitedById: userId }],
      ...(status && { status }),
      ...(type && { type }),
    };

    const [total, invitations] = await Promise.all([
      this.prisma.groupInvitation.count({ where }),
      this.prisma.groupInvitation.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          invitee: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      invitations,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async acceptInvitation(
    userId: string,
    groupId: string,
    invitationId: string,
  ) {
    return this.processAccept(userId, invitationId, groupId);
  }

  async acceptInvitationById(userId: string, invitationId: string) {
    return this.processAccept(userId, invitationId);
  }

  private async processAccept(
    userId: string,
    invitationId: string,
    groupId?: string,
  ) {
    const invitation = await this.prisma.groupInvitation.findFirst({
      where: {
        id: invitationId,
        ...(groupId ? { groupId } : {}),
        status: 'PENDING',
      },
      include: {
        group: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation or request not found');
    }

    if (invitation.type === 'INVITATION') {
      if (invitation.inviteeId !== userId) {
        throw new ForbiddenException(
          'Only the invited user can accept this invitation',
        );
      }
    } else if (invitation.type === 'JOIN_REQUEST') {
      const isOwner = invitation.group.createdById === userId;
      const adminMember = await this.prisma.groupMember.findFirst({
        where: {
          groupId: invitation.groupId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!isOwner && !adminMember) {
        throw new ForbiddenException(
          'Only group OWNER or ADMIN can approve join requests',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.groupMember.upsert({
        where: {
          groupId_userId: {
            groupId: invitation.groupId,
            userId: invitation.inviteeId,
          },
        },
        update: {
          status: 'ACTIVE',
          role: 'MEMBER',
          joinedAt: new Date(),
          leftAt: null,
        },
        create: {
          groupId: invitation.groupId,
          userId: invitation.inviteeId,
          role: 'MEMBER',
          status: 'ACTIVE',
        },
      });

      return tx.groupInvitation.update({
        where: { id: invitationId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          invitedBy: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
          invitee: {
            select: {
              id: true,
              username: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });
    });
  }

  async rejectInvitation(
    userId: string,
    groupId: string,
    invitationId: string,
  ) {
    return this.processReject(userId, invitationId, groupId);
  }

  async rejectInvitationById(userId: string, invitationId: string) {
    return this.processReject(userId, invitationId);
  }

  private async processReject(
    userId: string,
    invitationId: string,
    groupId?: string,
  ) {
    const invitation = await this.prisma.groupInvitation.findFirst({
      where: {
        id: invitationId,
        ...(groupId ? { groupId } : {}),
        status: 'PENDING',
      },
      include: {
        group: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Pending invitation or request not found');
    }

    if (invitation.type === 'INVITATION') {
      if (invitation.inviteeId !== userId) {
        throw new ForbiddenException(
          'Only the invited user can reject this invitation',
        );
      }
    } else if (invitation.type === 'JOIN_REQUEST') {
      const isOwner = invitation.group.createdById === userId;
      const isRequester = invitation.invitedById === userId;
      const adminMember = await this.prisma.groupMember.findFirst({
        where: {
          groupId: invitation.groupId,
          userId,
          role: { in: ['OWNER', 'ADMIN'] },
          status: 'ACTIVE',
        },
      });

      if (!isOwner && !adminMember && !isRequester) {
        throw new ForbiddenException(
          'Only group OWNER, ADMIN, or the requester can reject this join request',
        );
      }
    }

    return this.prisma.groupInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        invitee: {
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

  async cancelInvitation(
    userId: string,
    groupId: string,
    invitationId: string,
  ) {
    return this.processCancel(userId, invitationId, groupId);
  }

  async cancelInvitationById(userId: string, invitationId: string) {
    return this.processCancel(userId, invitationId);
  }

  private async processCancel(
    userId: string,
    invitationId: string,
    groupId?: string,
  ) {
    const invitation = await this.prisma.groupInvitation.findFirst({
      where: {
        id: invitationId,
        ...(groupId ? { groupId } : {}),
      },
      include: {
        group: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const isSender = invitation.invitedById === userId;
    const isReceiver = invitation.inviteeId === userId;
    const isOwner = invitation.group.createdById === userId;
    const adminMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: invitation.groupId,
        userId,
        role: { in: ['OWNER', 'ADMIN'] },
        status: 'ACTIVE',
      },
    });

    if (!isSender && !isReceiver && !isOwner && !adminMember) {
      throw new ForbiddenException(
        'You do not have permission to cancel this invitation',
      );
    }

    return this.prisma.groupInvitation.update({
      where: { id: invitationId },
      data: {
        status: 'CANCELLED',
        respondedAt: new Date(),
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        invitedBy: {
          select: {
            id: true,
            username: true,
            name: true,
            avatarUrl: true,
          },
        },
        invitee: {
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
}
