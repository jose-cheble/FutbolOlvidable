import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../entities/match.entity';
import { MatchTeam } from '../entities/match-team.entity';
import { MatchLineup } from '../entities/match-lineup.entity';
import { Player } from '../entities/player.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Vote } from '../entities/vote.entity';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Match,
      MatchTeam,
      MatchLineup,
      Player,
      GroupMember,
      Vote,
    ]),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, GroupMemberGuard],
  exports: [MatchesService],
})
export class MatchesModule {}
