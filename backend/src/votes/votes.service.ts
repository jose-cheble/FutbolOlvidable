import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { Match } from '../entities/match.entity';
import { MatchLineup } from '../entities/match-lineup.entity';
import { MatchStatus } from '../common/enums';
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
    @InjectRepository(MatchLineup)
    private readonly lineupsRepo: Repository<MatchLineup>,
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
    if (match.status !== MatchStatus.EN_VOTACION) {
      throw new BadRequestException('El partido no está en votación');
    }

    const existing = await this.votesRepo.findOne({
      where: { matchId, voterId },
    });
    if (existing) {
      throw new ConflictException('Ya votaste en este partido');
    }

    const lineups = await this.lineupsRepo.find({
      where: { matchId },
      relations: { player: true },
    });
    const lineupPlayerIds = new Set(lineups.map((l) => l.playerId));

    const selfPlayer = lineups.find((l) => l.player?.userId === voterId);
    const selfPlayerId = selfPlayer?.playerId;

    const votedIds = dto.votes.map((v) => v.playerId);
    if (new Set(votedIds).size !== votedIds.length) {
      throw new BadRequestException('Votos duplicados');
    }

    for (const vote of dto.votes) {
      if (!lineupPlayerIds.has(vote.playerId)) {
        throw new BadRequestException(
          'Solo se puede votar a jugadores del lineup',
        );
      }
      if (selfPlayerId && vote.playerId === selfPlayerId) {
        throw new BadRequestException('No podés votarte a vos mismo');
      }
    }

    if (!lineupPlayerIds.has(dto.mvpPlayerId)) {
      throw new BadRequestException('MVP debe estar en el lineup');
    }
    if (selfPlayerId && dto.mvpPlayerId === selfPlayerId) {
      throw new BadRequestException('No podés elegirte como MVP');
    }

    const expectedVoters = [...lineupPlayerIds].filter(
      (id) => id !== selfPlayerId,
    );
    // Voter must rate every lineup player except self
    if (votedIds.length !== expectedVoters.length) {
      throw new BadRequestException(
        `Debés votar a todos los jugadores del partido (${expectedVoters.length})`,
      );
    }
    for (const id of expectedVoters) {
      if (!votedIds.includes(id)) {
        throw new BadRequestException(
          'Faltan votos para algunos jugadores del lineup',
        );
      }
    }

    await this.dataSource.transaction(async (manager) => {
      const votes = dto.votes.map((v) =>
        manager.create(Vote, {
          matchId,
          voterId,
          votedPlayerId: v.playerId,
          score: v.score,
        }),
      );
      await manager.save(votes);

      const mvp = manager.create(MvpVote, {
        matchId,
        voterId,
        mvpPlayerId: dto.mvpPlayerId,
      });
      await manager.save(mvp);
    });

    await this.matchesService.maybeAutoClose(groupId, matchId);

    return {
      submitted: true,
      votesCount: dto.votes.length,
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
