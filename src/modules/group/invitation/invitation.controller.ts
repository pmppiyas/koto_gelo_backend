import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvitationService } from '#app/modules/group/invitation/invitation.service.js';
import {
  type CreateInvitationInput,
  createInvitationSchema,
} from '#app/modules/group/invitation/schemas/create-invitation.schema.js';
import {
  type InvitationQuery,
  invitationQuerySchema,
} from '#app/modules/group/invitation/schemas/invitation-query.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller({
  path: 'group/invitations',
  version: '1',
})
@UseGuards(AccessTokenGuard)
export class MyInvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Get('my')
  async findMyInvitations(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidation(invitationQuerySchema))
    query: InvitationQuery,
  ) {
    const result = await this.invitationService.findMyInvitations(
      user.id,
      query,
    );

    return {
      success: true,
      message: 'My invitations retrieved successfull!',
      data: result,
    };
  }

  @Post(':invitationId/accept')
  async accept(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invitationId') invitationId: string,
  ) {
    const result = await this.invitationService.acceptInvitationById(
      user.id,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation accepted successfull!',
      data: result,
    };
  }

  @Post(':invitationId/reject')
  async reject(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invitationId') invitationId: string,
  ) {
    const result = await this.invitationService.rejectInvitationById(
      user.id,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation rejected successfull!',
      data: result,
    };
  }

  @Delete(':invitationId')
  async cancel(
    @CurrentUser() user: AccessTokenPayload,
    @Param('invitationId') invitationId: string,
  ) {
    const result = await this.invitationService.cancelInvitationById(
      user.id,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation cancelled successfull!',
      data: result,
    };
  }
}

@Controller({
  path: 'group/:groupId/invitations',
  version: '1',
})
@UseGuards(AccessTokenGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Body(new ZodValidation(createInvitationSchema))
    body: CreateInvitationInput,
  ) {
    const result = await this.invitationService.createInvitation(
      user.id,
      groupId,
      body,
    );

    return {
      success: true,
      message: 'Invitation sent successfull!',
      data: result,
    };
  }

  @Post('request-join')
  async requestJoin(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.invitationService.createJoinRequest(
      user.id,
      groupId,
    );

    return {
      success: true,
      message: 'Join request sent successfull!',
      data: result,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Query(new ZodValidation(invitationQuerySchema))
    query: InvitationQuery,
  ) {
    const result = await this.invitationService.findAll(
      user.id,
      groupId,
      query,
    );

    return {
      success: true,
      message: 'Invitations retrieved successfull!',
      data: result,
    };
  }

  @Post(':invitationId/accept')
  async accept(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Param('invitationId') invitationId: string,
  ) {
    const result = await this.invitationService.acceptInvitation(
      user.id,
      groupId,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation accepted successfull!',
      data: result,
    };
  }

  @Post(':invitationId/reject')
  async reject(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Param('invitationId') invitationId: string,
  ) {
    const result = await this.invitationService.rejectInvitation(
      user.id,
      groupId,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation rejected successfull!',
      data: result,
    };
  }

  @Delete(':invitationId')
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Param('invitationId') invitationId: string,
  ) {
    const result = await this.invitationService.cancelInvitation(
      user.id,
      groupId,
      invitationId,
    );

    return {
      success: true,
      message: 'Invitation cancelled successfull!',
      data: result,
    };
  }
}
