import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
    // Guardar dentro de la TX y leer después del commit:
    // findOne usa otro repo y no ve filas aún no confirmadas.
    const matchId = await this.dataSource.transaction(async (manager) => {
      const match = manager.create(Match, {
        groupId,
        playedAt: dto.playedAt,
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
            }
          : null,
        teamName: l.matchTeam?.name,
        teamColor: l.matchTeam?.color,
      })),
    };
  }

  async updateLineup(groupId: string, matchId: string, dto: UpdateLineupDto) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');
    if (match.status !== MatchStatus.BORRADOR) {
      throw new BadRequestException(
        'Solo se puede editar el lineup en borrador',
      );
    }

    const teams = await this.teamsRepo.find({ where: { matchId } });
    const teamIds = new Set(teams.map((t) => t.id));

    if (dto.teams?.length) {
      for (const t of dto.teams) {
        if (!teamIds.has(t.id)) {
          throw new BadRequestException('Equipo inválido');
        }
        const team = teams.find((x) => x.id === t.id)!;
        if (t.name !== undefined) team.name = t.name;
        if (t.color !== undefined) team.color = t.color;
        await this.teamsRepo.save(team);
      }
    }

    const playerIds = dto.lineups.map((l) => l.playerId);
    if (new Set(playerIds).size !== playerIds.length) {
      throw new BadRequestException('Jugadores duplicados en el lineup');
    }

    if (playerIds.length) {
      const players = await this.playersRepo.find({
        where: { id: In(playerIds), groupId },
      });
      if (players.length !== playerIds.length) {
        throw new BadRequestException(
          'Todos los jugadores deben pertenecer al grupo',
        );
      }
    }

    for (const entry of dto.lineups) {
      if (!teamIds.has(entry.matchTeamId)) {
        throw new BadRequestException('Equipo inválido en lineup');
      }
    }

    await this.lineupsRepo.delete({ matchId });

    const entities = dto.lineups.map((l) =>
      this.lineupsRepo.create({
        matchId,
        matchTeamId: l.matchTeamId,
        playerId: l.playerId,
        matchPosition: l.matchPosition,
        fieldX: l.fieldX,
        fieldY: l.fieldY,
      }),
    );
    if (entities.length) {
      await this.lineupsRepo.save(entities);
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

    const next = dto.status;
    const current = match.status;

    if (current === MatchStatus.CERRADO) {
      throw new BadRequestException('El partido ya está cerrado');
    }

    if (
      current === MatchStatus.BORRADOR &&
      next === MatchStatus.EN_VOTACION
    ) {
      const lineups = await this.lineupsRepo.find({ where: { matchId } });
      const teams = await this.teamsRepo.find({ where: { matchId } });
      for (const team of teams) {
        const count = lineups.filter((l) => l.matchTeamId === team.id).length;
        if (count < 1) {
          throw new BadRequestException(
            `Cada equipo necesita al menos 1 jugador (${team.name})`,
          );
        }
      }
      match.status = MatchStatus.EN_VOTACION;
    } else if (
      current === MatchStatus.EN_VOTACION &&
      next === MatchStatus.CERRADO
    ) {
      match.status = MatchStatus.CERRADO;
    } else if (current === next) {
      // no-op
    } else {
      throw new BadRequestException(
        `Transición inválida: ${current} → ${next}`,
      );
    }

    await this.matchesRepo.save(match);
    return this.findOne(groupId, matchId);
  }

  async remove(groupId: string, matchId: string) {
    const match = await this.matchesRepo.findOne({
      where: { id: matchId, groupId },
    });
    if (!match) throw new NotFoundException('Partido no encontrado');
    if (match.status === MatchStatus.CERRADO) {
      throw new BadRequestException('No se puede eliminar un partido cerrado');
    }
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
