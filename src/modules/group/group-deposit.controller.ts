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
import { GroupDepositService } from './group-deposit.service.js';
import {
  type CreateGroupDepositInput,
  createGroupDepositSchema,
} from './schemas/create-group-deposit.schema.js';
import {
  type UpdateGroupDepositInput,
  updateGroupDepositSchema,
} from './schemas/update-group-deposit.schema.js';
import {
  type GroupDepositQuery,
  groupDepositQuerySchema,
} from './schemas/group-deposit-query.schema.js';
import { ZodValidation } from '#app/common/pipe/ZodValidation.js';
import { AccessTokenGuard } from '#app/common/guard/access-token.guard.js';
import { CurrentUser } from '#app/common/decorator/current-user.decorator.js';
import type { AccessTokenPayload } from '#app/common/types/access-token-payload.type.js';

@Controller({
  path: 'group/deposits',
  version: '1',
})
@UseGuards(AccessTokenGuard)
export class GroupDepositController {
  constructor(private readonly depositService: GroupDepositService) {}

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body(new ZodValidation(createGroupDepositSchema))
    body: CreateGroupDepositInput,
  ) {
    const result = await this.depositService.create(user.id, body);

    return {
      success: true,
      message: 'Group deposit recorded successfully!',
      data: result,
    };
  }

  @Get()
  async findAll(
    @CurrentUser() user: AccessTokenPayload,
    @Query(new ZodValidation(groupDepositQuerySchema))
    query: GroupDepositQuery,
  ) {
    const result = await this.depositService.findAll(user.id, query);

    return {
      success: true,
      message: 'Group deposits retrieved successfully!',
      data: result,
    };
  }

  @Get(':groupId/summary')
  async getSummary(
    @CurrentUser() user: AccessTokenPayload,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.depositService.getGroupDepositSummary(
      user.id,
      groupId,
    );

    return {
      success: true,
      message: 'Group deposit summary retrieved successfully!',
      data: result,
    };
  }

  @Get('item/:id')
  async findOne(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const result = await this.depositService.findOne(user.id, id);

    return {
      success: true,
      message: 'Deposit retrieved successfully!',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
    @Body(new ZodValidation(updateGroupDepositSchema))
    body: UpdateGroupDepositInput,
  ) {
    const result = await this.depositService.update(user.id, id, body);

    return {
      success: true,
      message: 'Deposit updated successfully!',
      data: result,
    };
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id') id: string,
  ) {
    const result = await this.depositService.remove(user.id, id);

    return {
      success: true,
      message: 'Deposit deleted successfully!',
      data: result,
    };
  }
}
