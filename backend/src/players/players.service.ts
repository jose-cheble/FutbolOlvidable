import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { Group } from '../entities/group.entity';
import { User } from '../entities/user.entity';
import { Vote } from '../entities/vote.entity';
import { MvpVote } from '../entities/mvp-vote.entity';
import { MatchLineup } from '../entities/match-lineup.entity';
import { MatchStatus } from '../common/enums';
import { CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
    @InjectRepository(Group)
    private readonly groupsRepo: Repository<Group>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Vote)
    private readonly votesRepo: Repository<Vote>,
    @InjectRepository(MvpVote)
    private readonly mvpVotesRepo: Repository<MvpVote>,
    @InjectRepository(MatchLineup)
    private readonly lineupsRepo: Repository<MatchLineup>,
  ) {}

  private toDto(player: Player) {
    return {
      id: player.id,
      groupId: player.groupId,
      name: player.name,
      defaultPosition: player.defaultPosition,
      userId: player.userId,
      // Foto solo del usuario vinculado (no hay foto propia del jugador)
      photoUrl: player.user?.photoUrl ?? null,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
    };
  }

  private async resolveUserPhoto(userId: string | null | undefined) {
    if (!userId) return null;
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    return user?.photoUrl ?? null;
  }

  async create(groupId: string, dto: CreatePlayerDto) {
    const group = await this.groupsRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const photoUrl = await this.resolveUserPhoto(dto.userId);

    const player = this.playersRepo.create({
      groupId,
      name: dto.name,
      defaultPosition: dto.defaultPosition,
      photoUrl,
      userId: dto.userId ?? null,
    });
    await this.playersRepo.save(player);
    return this.findOne(groupId, player.id);
  }

  async findAll(groupId: string) {
    const players = await this.playersRepo.find({
      where: { groupId },
      relations: { user: true },
      order: { name: 'ASC' },
    });
    return players.map((p) => this.toDto(p));
  }

  async findOne(groupId: string, playerId: string) {
    const player = await this.playersRepo.findOne({
      where: { id: playerId, groupId },
      relations: { user: true },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return this.toDto(player);
  }

  async update(groupId: string, playerId: string, dto: UpdatePlayerDto) {
    const player = await this.playersRepo.findOne({
      where: { id: playerId, groupId },
      relations: { user: true },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    if (dto.name !== undefined) player.name = dto.name;
    if (dto.defaultPosition !== undefined)
      player.defaultPosition = dto.defaultPosition;

    if (dto.userId !== undefined) {
      player.userId = dto.userId;
      // Al vincular/desvincular, la foto viene del usuario (o null)
      player.photoUrl = await this.resolveUserPhoto(dto.userId);
    }

    // Ignorar photoUrl del DTO: la foto no es del jugador
    await this.playersRepo.save(player);
    return this.findOne(groupId, playerId);
  }

  async remove(groupId: string, playerId: string) {
    const player = await this.playersRepo.findOne({
      where: { id: playerId, groupId },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');

    // Borrar dependencias explícitas por si el FK no está en CASCADE aún
    await this.lineupsRepo.delete({ playerId });
    await this.votesRepo.delete({ votedPlayerId: playerId });
    await this.mvpVotesRepo.delete({ mvpPlayerId: playerId });
    await this.playersRepo.delete({ id: playerId, groupId });

    return { deleted: true };
  }

  async stats(groupId: string, playerId: string) {
    const player = await this.findOne(groupId, playerId);

    const lineups = await this.lineupsRepo
      .createQueryBuilder('l')
      .innerJoin('l.match', 'match')
      .where('l.player_id = :playerId', { playerId })
      .andWhere('match.group_id = :groupId', { groupId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .getMany();

    const matchesPlayed = lineups.length;

    const avgResult = await this.votesRepo
      .createQueryBuilder('v')
      .innerJoin('v.match', 'match')
      .select('AVG(v.score)', 'avg')
      .addSelect('COUNT(v.id)', 'votes')
      .where('v.voted_player_id = :playerId', { playerId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .andWhere('match.group_id = :groupId', { groupId })
      .getRawOne();

    const bestResult = await this.votesRepo
      .createQueryBuilder('v')
      .innerJoin('v.match', 'match')
      .select('match.id', 'matchId')
      .addSelect('AVG(v.score)', 'avg')
      .where('v.voted_player_id = :playerId', { playerId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .andWhere('match.group_id = :groupId', { groupId })
      .groupBy('match.id')
      .orderBy('avg', 'DESC')
      .limit(1)
      .getRawOne();

    const mvpCount = await this.mvpVotesRepo
      .createQueryBuilder('m')
      .innerJoin('m.match', 'match')
      .where('m.mvp_player_id = :playerId', { playerId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .andWhere('match.group_id = :groupId', { groupId })
      .getCount();

    const recent = await this.votesRepo
      .createQueryBuilder('v')
      .innerJoin('v.match', 'match')
      .select('match.id', 'matchId')
      .addSelect('match.played_at', 'playedAt')
      .addSelect('AVG(v.score)', 'avg')
      .where('v.voted_player_id = :playerId', { playerId })
      .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
      .andWhere('match.group_id = :groupId', { groupId })
      .groupBy('match.id')
      .addGroupBy('match.played_at')
      .orderBy('match.played_at', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      player,
      matchesPlayed,
      avgScore: avgResult?.avg
        ? Number(Number(avgResult.avg).toFixed(1))
        : null,
      totalVotes: avgResult?.votes ? Number(avgResult.votes) : 0,
      bestMatchAvg: bestResult?.avg
        ? Number(Number(bestResult.avg).toFixed(1))
        : null,
      mvpCount,
      recentForm: recent.map((r) => ({
        matchId: r.matchId,
        playedAt: r.playedAt,
        avg: Number(Number(r.avg).toFixed(1)),
      })),
    };
  }
}
