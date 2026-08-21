import { Module } from '@nestjs/common';
import { GroupController } from '#app/modules/group/group.controller.js';
import { GroupService } from '#app/modules/group/group.service.js';
import {
  InvitationController,
  MyInvitationController,
} from '#app/modules/group/invitation/invitation.controller.js';
import { InvitationService } from '#app/modules/group/invitation/invitation.service.js';
import { GroupDepositController } from '#app/modules/group/group-deposit.controller.js';
import { GroupDepositService } from '#app/modules/group/group-deposit.service.js';
import { AuthModule } from '#app/modules/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    GroupController,
    GroupDepositController,
    MyInvitationController,
    InvitationController,
  ],
  providers: [GroupService, GroupDepositService, InvitationService],
  exports: [GroupService, GroupDepositService, InvitationService],
})
export class GroupModule {}
