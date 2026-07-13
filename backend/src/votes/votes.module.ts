import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { Match } from '../entities/match.entity';
import { MatchLineup } from '../entities/match-lineup.entity';
import { GroupMember } from '../entities/group-member.entity';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { MatchesModule } from '../matches/matches.module';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vote,
      MvpVote,
      Match,
      MatchLineup,
      GroupMember,
    ]),
    MatchesModule,
  ],
  controllers: [VotesController],
  providers: [VotesService, GroupMemberGuard],
  exports: [VotesService],
})
export class VotesModule {}
