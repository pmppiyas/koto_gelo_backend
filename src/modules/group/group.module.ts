import { Module } from '@nestjs/common';
import { GroupController } from '#app/modules/group/group.controller.js';
import { GroupService } from '#app/modules/group/group.service.js';
import { AuthModule } from '#app/modules/auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService],
})
export class GroupModule {}
