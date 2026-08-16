import { Module } from '@nestjs/common';
import { GroupController } from '#app/modules/group/group.controller.js';
import { GroupService } from '#app/modules/group/group.service.js';
import {
  InvitationController,
  MyInvitationController,
} from '#app/modules/group/invitation/invitation.controller.js';
import { InvitationService } from '#app/modules/group/invitation/invitation.service.js';
import { AuthModule } from '#app/modules/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    GroupController,
    MyInvitationController,
    InvitationController,
  ],
  providers: [GroupService, InvitationService],
  exports: [GroupService, InvitationService],
})
export class GroupModule {}
