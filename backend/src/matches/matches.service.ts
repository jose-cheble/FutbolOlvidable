import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Match } from '../entities/match.entity';
import { MatchTeam } from '../entities/match-team.entity';
import { MatchLineup } from '../entities/match-lineup.entity';
import { Player } from '../entities/player.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Vote } from '../entities/vote.entity';
import { MatchStatus } from '../common/enums';
import {
  CreateMatchDto,
  UpdateLineupDto,
  UpdateMatchStatusDto,
} from './dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(Match)
    private readonly matchesRepo: Repository<Match>,
    @InjectRepository(MatchTeam)
    private readonly teamsRepo: Repository<MatchTeam>,
    @InjectRepository(MatchLineup)
    private readonly lineupsRepo: Repository<MatchLineup>,
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
    @InjectRepository(Vote)
    private readonly votesRepo: Repository<Vote>,
    private readonly dataSource: DataSource,
  ) {}

  async create(groupId: string, dto: CreateMatchDto) {
    const matchId = await this.dataSource.transaction(async (manager) => {
      const match = manager.create(Match, {
        groupId,
        playedAt: dto.playedAt,
        playersPerTeam: dto.playersPerTeam ?? 7,
        status: MatchStatus.BORRADOR,
      });
      await manager.save(match);

      const teamA = manager.create(MatchTeam, {
        matchId: match.id,
        name: 'Equipo A',
        color: '#1e88e5',
      });
      const teamB = manager.create(MatchTeam, {
        matchId: match.id,
        name: 'Equipo B',
        color: '#e53935',
      });
      await manager.save([teamA, teamB]);

      return match.id;
    });

    return this.findOne(groupId, matchId);
  }

  async findAll(groupId: string) {
    return this.matchesRepo.find({
      where: { groupId },
      relations: { teams: true },
      order: { playedAt: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(groupId: string, matchId: string) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
      relations: {
        teams: { lineups: { player: true } },
      },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');

    const lineups = await this.lineupsRepo.find({
      where: { matchId },
      relations: { player: { user: true }, matchTeam: true },
    });

    const roster = await this.loadRosterWithScores(groupId);

    return {
      ...match,
      lineups: lineups.map((l) => ({
        id: l.id,
        playerId: l.playerId,
        matchTeamId: l.matchTeamId,
        matchPosition: l.matchPosition,
        fieldX: l.fieldX,
        fieldY: l.fieldY,
        player: l.player
          ? {
              id: l.player.id,
              name: l.player.name,
              photoUrl: l.player.user?.photoUrl ?? null,
              defaultPosition: l.player.defaultPosition,
              userId: l.player.userId,
              avgScore:
                roster.find((p) => p.id === l.playerId)?.avgScore ?? null,
            }
          : null,
        teamName: l.matchTeam?.name,
        teamColor: l.matchTeam?.color,
      })),
      roster,
    };
  }

  private async loadRosterWithScores(groupId: string) {
    const players = await this.playersRepo.find({
      where: { groupId },
      relations: { user: true },
      order: { name: 'ASC' },
    });
    if (!players.length) return [];

    const playerIds = players.map((p) => p.id);
    const avgRows = await this.votesRepo
      .createQueryBuilder('v')
      .innerJoin('v.match', 'match')
      .select('v.voted_player_id', 'playerId')
      .addSelect('AVG(v.score)', 'avg')
      .where('v.voted_player_id IN (:...playerIds)', { playerIds })
      .andWhere('match.group_id = :groupId', { groupId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .groupBy('v.voted_player_id')
      .getRawMany();

    const avgByPlayer = new Map(
      avgRows.map((r) => [
        r.playerId,
        r.avg ? Number(Number(r.avg).toFixed(1)) : null,
      ]),
    );

    return players.map((p) => ({
      id: p.id,
      groupId: p.groupId,
      name: p.name,
      defaultPosition: p.defaultPosition,
      userId: p.userId,
      photoUrl: p.user?.photoUrl ?? null,
      avgScore: avgByPlayer.get(p.id) ?? null,
    }));
  }

  async updateLineup(groupId: string, matchId: string, dto: UpdateLineupDto) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');

    if (dto.teams?.length) {
      for (const t of dto.teams) {
        const patch: Partial<MatchTeam> = {};
        if (t.name !== undefined) patch.name = t.name;
        if (t.color !== undefined) patch.color = t.color;
        if (Object.keys(patch).length) {
          await this.teamsRepo.update({ id: t.id, matchId }, patch);
        }
      }
    }

    await this.lineupsRepo.delete({ matchId });

    const lineups = dto.lineups ?? [];
    if (lineups.length) {
      await this.lineupsRepo.save(
        lineups.map((l) =>
          this.lineupsRepo.create({
            matchId,
            matchTeamId: l.matchTeamId,
            playerId: l.playerId,
            matchPosition: l.matchPosition,
            fieldX: l.fieldX,
            fieldY: l.fieldY,
          }),
        ),
      );
    }

    return this.findOne(groupId, matchId);
  }

  async updateStatus(
    groupId: string,
    matchId: string,
    dto: UpdateMatchStatusDto,
  ) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');

    match.status = dto.status;
    await this.matchesRepo.save(match);
    return this.findOne(groupId, matchId);
  }

  async remove(groupId: string, matchId: string) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');
    await this.matchesRepo.remove(match);
    return { deleted: true };
  }

  async maybeAutoClose(groupId: string, matchId: string) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match || match.status !== MatchStatus.EN_VOTACION) return;

    const memberCount = await this.membersRepo.count({ where: { groupId } });
    const voterCount = await this.votesRepo
      .createQueryBuilder('v')
      .select('COUNT(DISTINCT v.voter_id)', 'count')
      .where('v.match_id = :matchId', { matchId })
      .getRawOne();

    if (Number(voterCount?.count ?? 0) >= memberCount && memberCount > 0) {
      match.status = MatchStatus.CERRADO;
      await this.matchesRepo.save(match);
    }
  }
}
