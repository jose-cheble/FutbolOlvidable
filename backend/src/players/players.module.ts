import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from '../entities/player.entity';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { MatchLineup } from '../entities/match-lineup.entity';
import { GroupMember } from '../entities/group-member.entity';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Player,
      Group,
      User,
      Vote,
      MvpVote,
      MatchLineup,
      GroupMember,
    ]),
  ],
  controllers: [PlayersController],
  providers: [PlayersService, GroupMemberGuard],
  exports: [PlayersService],
})
export class PlayersModule {}
