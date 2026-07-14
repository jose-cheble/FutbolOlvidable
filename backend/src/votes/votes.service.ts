import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { Match } from '../entities/match.entity';
import { MatchesService } from '../matches/matches.service';
import { SubmitVotesDto } from './dto/vote.dto';

@Injectable()
export class VotesService {
  constructor(
    @InjectRepository(Vote)
    private readonly votesRepo: Repository<Vote>,
    @InjectRepository(MvpVote)
    private readonly mvpVotesRepo: Repository<MvpVote>,
    @InjectRepository(Match)
    private readonly matchesRepo: Repository<Match>,
    private readonly matchesService: MatchesService,
    private readonly dataSource: DataSource,
  ) {}

  async submit(
    groupId: string,
    matchId: string,
    voterId: string,
    dto: SubmitVotesDto,
  ) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');

    const existing = await this.votesRepo.findOne({
      where: { matchId, voterId },
    });
    if (existing) {
      const mvp = await this.mvpVotesRepo.findOne({
        where: { matchId, voterId },
      });
      return {
        submitted: true,
        votesCount: dto.votes?.length ?? 0,
        mvpPlayerId: mvp?.mvpPlayerId ?? dto.mvpPlayerId,
      };
    }

    const votes = dto.votes ?? [];
    await this.dataSource.transaction(async (manager) => {
      if (votes.length) {
        await manager.save(
          votes.map((v) =>
            manager.create(Vote, {
              matchId,
              voterId,
              votedPlayerId: v.playerId,
              score: v.score,
            }),
          ),
        );
      }

      if (dto.mvpPlayerId) {
        await manager.save(
          manager.create(MvpVote, {
            matchId,
            voterId,
            mvpPlayerId: dto.mvpPlayerId,
          }),
        );
      }
    });

    await this.matchesService.maybeAutoClose(groupId, matchId);

    return {
      submitted: true,
      votesCount: votes.length,
      mvpPlayerId: dto.mvpPlayerId,
    };
  }

  async myStatus(groupId: string, matchId: string, voterId: string) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');

    const votes = await this.votesRepo.find({
      where: { matchId, voterId },
    });
    const mvp = await this.mvpVotesRepo.findOne({
      where: { matchId, voterId },
    });

    return {
      hasVoted: votes.length > 0,
      votes: votes.map((v) => ({
        playerId: v.votedPlayerId,
        score: v.score,
      })),
      mvpPlayerId: mvp?.mvpPlayerId ?? null,
    };
  }
}
