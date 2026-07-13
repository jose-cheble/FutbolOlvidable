import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Player } from '../entities/player.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupMember, Player])],
  controllers: [GroupsController],
  providers: [GroupsService, GroupMemberGuard],
  exports: [GroupsService, TypeOrmModule, GroupMemberGuard],
})
export class GroupsModule {}
