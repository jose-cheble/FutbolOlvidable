import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Player } from '../entities/player.entity';
import { Vote } from '../entities/vote.entity';
import { MatchStatus } from '../common/enums';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
    @InjectRepository(Vote)
    private readonly votesRepo: Repository<Vote>,
  ) {}

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    };
  }

  async update(id: string, requesterId: string, dto: UpdateUserDto) {
    if (id !== requesterId) {
      throw new ForbiddenException('Solo podés editar tu propio perfil');
    }
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (dto.displayName) user.displayName = dto.displayName;
    await this.usersRepo.save(user);
    return this.findOne(id);
  }

  async remove(id: string, requesterId: string) {
    if (id !== requesterId) {
      throw new ForbiddenException('Solo podés eliminar tu propia cuenta');
    }
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.usersRepo.remove(user);
    return { deleted: true };
  }

  async myGroups(userId: string) {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: { group: true },
      order: { joinedAt: 'DESC' },
    });

    const result = [];
    for (const m of memberships) {
      const player = await this.playersRepo.findOne({
        where: { groupId: m.groupId, userId },
      });

      let avgScore: number | null = null;
      let matchesPlayed = 0;

      if (player) {
        const stats = await this.votesRepo
          .createQueryBuilder('v')
          .innerJoin('v.match', 'match')
          .select('AVG(v.score)', 'avg')
          .addSelect('COUNT(DISTINCT match.id)', 'matches')
          .where('v.voted_player_id = :playerId', { playerId: player.id })
          .andWhere('match.status = :status', { status: MatchStatus.CERRADO })
          .getRawOne();

        avgScore = stats?.avg ? Number(Number(stats.avg).toFixed(1)) : null;
        matchesPlayed = stats?.matches ? Number(stats.matches) : 0;
      }

      result.push({
        id: m.group.id,
        name: m.group.name,
        photoUrl: m.group.photoUrl,
        maxPlayers: m.group.maxPlayers,
        playerId: player?.id ?? null,
        avgScore,
        matchesPlayed,
        joinedAt: m.joinedAt,
      });
    }

    return result;
  }
}
