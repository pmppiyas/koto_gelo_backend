import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GroupService } from '#app/modules/group/group.service.js';
import {
  type CreateGroupInput,
  createGroupSchema,
} from '#app/modules/group/schemas/create-group.schema.js';
import {
  type UpdateGroupInput,
  updateGroupSchema,
} from '#app/modules/group/schemas/update-group.schema.js';
import {
  type GroupQuery,
  groupQuerySchema,
} from '#app/modules/group/schemas/group-query.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller('group')
@UseGuards(AccessTokenGuard)
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidation(createGroupSchema))
    body: CreateGroupInput,
  ) {
    const result = await this.groupService.create(user.id, body);

    return {
      success: true,
      message: 'Group created successfull!',
      data: result,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidation(groupQuerySchema))
    query: GroupQuery,
  ) {
    const result = await this.groupService.findAll(user.id, query);

    return {
      success: true,
      message: 'Groups retrieved successfull!',
      data: result,
    };
  }

  @Get(':groupId')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.groupService.findOne(user.id, groupId);

    return {
      success: true,
      message: 'Group retrieved successfull!',
      data: result,
    };
  }

  @Patch(':groupId')
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
    @Body(new ZodValidation(updateGroupSchema))
    body: UpdateGroupInput,
  ) {
    const result = await this.groupService.update(user.id, groupId, body);

    return {
      success: true,
      message: 'Group updated successfull!',
      data: result,
    };
  }

  @Delete(':groupId')
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.groupService.remove(user.id, groupId);

    return {
      success: true,
      message: 'Group deleted successfull!',
      data: result,
    };
  }
}
