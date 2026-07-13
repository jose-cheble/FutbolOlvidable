import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../entities/player.entity';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { GroupMember } from '../entities/group-member.entity';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player, Vote, MvpVote, GroupMember]),
  ],
  controllers: [RankingsController],
  providers: [RankingsService, GroupMemberGuard],
})
export class RankingsModule {}
