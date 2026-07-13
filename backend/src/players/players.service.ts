import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../entities/player.entity';
import { Group } from '../entities/group.entity';
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
    @InjectRepository(Vote)
    private readonly votesRepo: Repository<Vote>,
    @InjectRepository(MvpVote)
    private readonly mvpVotesRepo: Repository<MvpVote>,
    @InjectRepository(MatchLineup)
    private readonly lineupsRepo: Repository<MatchLineup>,
  ) {}

  async create(groupId: string, dto: CreatePlayerDto) {
    const group = await this.groupsRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const count = await this.playersRepo.count({ where: { groupId } });
    if (count >= group.maxPlayers) {
      throw new BadRequestException(
        `El grupo ya alcanzó el máximo de ${group.maxPlayers} jugadores`,
      );
    }

    if (dto.userId) {
      const linked = await this.playersRepo.findOne({
        where: { groupId, userId: dto.userId },
      });
      if (linked) {
        throw new ConflictException(
          'Este usuario ya tiene un jugador en este grupo',
        );
      }
    }

    const player = this.playersRepo.create({
      groupId,
      name: dto.name,
      defaultPosition: dto.defaultPosition,
      photoUrl: dto.photoUrl ?? null,
      userId: dto.userId ?? null,
    });
    await this.playersRepo.save(player);
    return player;
  }

  async findAll(groupId: string) {
    return this.playersRepo.find({
      where: { groupId },
      order: { name: 'ASC' },
    });
  }

  async findOne(groupId: string, playerId: string) {
    const player = await this.playersRepo.findOne({
      where: { id: playerId, groupId },
    });
    if (!player) throw new NotFoundException('Jugador no encontrado');
    return player;
  }

  async update(groupId: string, playerId: string, dto: UpdatePlayerDto) {
    const player = await this.findOne(groupId, playerId);

    if (dto.userId !== undefined && dto.userId !== null) {
      const linked = await this.playersRepo.findOne({
        where: { groupId, userId: dto.userId },
      });
      if (linked && linked.id !== playerId) {
        throw new ConflictException(
          'Este usuario ya tiene un jugador en este grupo',
        );
      }
    }

    if (dto.name !== undefined) player.name = dto.name;
    if (dto.defaultPosition !== undefined)
      player.defaultPosition = dto.defaultPosition;
    if (dto.photoUrl !== undefined) player.photoUrl = dto.photoUrl;
    if (dto.userId !== undefined) player.userId = dto.userId;

    await this.playersRepo.save(player);
    return player;
  }

  async remove(groupId: string, playerId: string) {
    const player = await this.findOne(groupId, playerId);
    await this.playersRepo.remove(player);
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
