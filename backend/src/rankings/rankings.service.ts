import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { MatchStatus } from '../common/enums';

@Injectable()
export class RankingsService {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
    @InjectRepository(Vote)
    private readonly votesRepo: Repository<Vote>,
    @InjectRepository(MvpVote)
    private readonly mvpVotesRepo: Repository<MvpVote>,
  ) {}

  async getRankings(
    groupId: string,
    type: 'default' | 'match' | 'mvp' = 'default',
    position?: string,
  ) {
    if (type === 'mvp') {
      return this.mvpRanking(groupId);
    }

    if (type === 'match' && position) {
      return this.matchPositionRanking(groupId, position);
    }

    return this.generalRanking(groupId, type === 'default' ? position : undefined);
  }

  private async generalRanking(groupId: string, defaultPosition?: string) {
    const qb = this.votesRepo
      .createQueryBuilder('v')
      .innerJoin('v.match', 'match')
      .innerJoin('v.votedPlayer', 'player')
      .select('player.id', 'playerId')
      .addSelect('player.name', 'name')
      .addSelect('player.photo_url', 'photoUrl')
      .addSelect('player.default_position', 'defaultPosition')
      .addSelect('AVG(v.score)', 'avgScore')
      .addSelect('COUNT(DISTINCT match.id)', 'matchesPlayed')
      .addSelect('COUNT(v.id)', 'votesReceived')
      .where('match.group_id = :groupId', { groupId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .groupBy('player.id')
      .addGroupBy('player.name')
      .addGroupBy('player.photo_url')
      .addGroupBy('player.default_position')
      .orderBy('avgScore', 'DESC');

    if (defaultPosition) {
      qb.andWhere('player.default_position = :pos', { pos: defaultPosition });
    }

    const rows = await qb.getRawMany();
    return rows.map((r, i) => ({
      rank: i + 1,
      playerId: r.playerId,
      name: r.name,
      photoUrl: r.photoUrl,
      defaultPosition: r.defaultPosition,
      avgScore: Number(Number(r.avgScore).toFixed(1)),
      matchesPlayed: Number(r.matchesPlayed),
      votesReceived: Number(r.votesReceived),
    }));
  }

  private async matchPositionRanking(groupId: string, position: string) {
    const rows = await this.votesRepo
      .createQueryBuilder('v')
      .innerJoin('v.match', 'match')
      .innerJoin('v.votedPlayer', 'player')
      .innerJoin(
        'match_lineups',
        'lineup',
        'lineup.match_id = match.id AND lineup.player_id = player.id',
      )
      .select('player.id', 'playerId')
      .addSelect('player.name', 'name')
      .addSelect('player.photo_url', 'photoUrl')
      .addSelect('AVG(v.score)', 'avgScore')
      .addSelect('COUNT(DISTINCT match.id)', 'matchesPlayed')
      .where('match.group_id = :groupId', { groupId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .andWhere('lineup.match_position = :position', { position })
      .groupBy('player.id')
      .addGroupBy('player.name')
      .addGroupBy('player.photo_url')
      .orderBy('avgScore', 'DESC')
      .getRawMany();

    return rows.map((r, i) => ({
      rank: i + 1,
      playerId: r.playerId,
      name: r.name,
      photoUrl: r.photoUrl,
      matchPosition: position,
      avgScore: Number(Number(r.avgScore).toFixed(1)),
      matchesPlayed: Number(r.matchesPlayed),
    }));
  }

  private async mvpRanking(groupId: string) {
    const rows = await this.mvpVotesRepo
      .createQueryBuilder('m')
      .innerJoin('m.match', 'match')
      .innerJoin('m.mvpPlayer', 'player')
      .select('player.id', 'playerId')
      .addSelect('player.name', 'name')
      .addSelect('player.photo_url', 'photoUrl')
      .addSelect('COUNT(m.id)', 'mvpCount')
      .where('match.group_id = :groupId', { groupId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .groupBy('player.id')
      .addGroupBy('player.name')
      .addGroupBy('player.photo_url')
      .orderBy('mvpCount', 'DESC')
      .getRawMany();

    return rows.map((r, i) => ({
      rank: i + 1,
      playerId: r.playerId,
      name: r.name,
      photoUrl: r.photoUrl,
      mvpCount: Number(r.mvpCount),
    }));
  }
}
