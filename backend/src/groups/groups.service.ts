import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group } from '../entities/group.entity';
import { GroupMember } from '../entities/group-member.entity';
import { Player } from '../entities/player.entity';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
  ) {}

  async create(userId: string, dto: CreateGroupDto) {
    const group = this.groupsRepo.create({
      name: dto.name,
      maxPlayers: dto.maxPlayers,
      photoUrl: dto.photoUrl ?? null,
    });
    await this.groupsRepo.save(group);

    const member = this.membersRepo.create({
      groupId: group.id,
      userId,
    });
    await this.membersRepo.save(member);

    return this.findOne(group.id);
  }

  async findAllForUser(userId: string) {
    const memberships = await this.membersRepo.find({
      where: { userId },
      relations: { group: true },
      order: { joinedAt: 'DESC' },
    });
    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      photoUrl: m.group.photoUrl,
      maxPlayers: m.group.maxPlayers,
      joinedAt: m.joinedAt,
    }));
  }

  async findOne(id: string) {
    const group = await this.groupsRepo.findOne({
      where: { id },
      relations: { members: { user: true } },
    });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const playerCount = await this.playersRepo.count({
      where: { groupId: id },
    });

    return {
      id: group.id,
      name: group.name,
      photoUrl: group.photoUrl,
      maxPlayers: group.maxPlayers,
      playerCount,
      members: group.members.map((m) => ({
        userId: m.userId,
        displayName: m.user?.displayName,
        email: m.user?.email,
        joinedAt: m.joinedAt,
      })),
      createdAt: group.createdAt,
    };
  }

  async update(id: string, dto: UpdateGroupDto) {
    const group = await this.groupsRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    if (dto.maxPlayers !== undefined) group.maxPlayers = dto.maxPlayers;
    if (dto.name !== undefined) group.name = dto.name;
    if (dto.photoUrl !== undefined) group.photoUrl = dto.photoUrl;

    await this.groupsRepo.save(group);
    return this.findOne(id);
  }

  async remove(id: string) {
    const group = await this.groupsRepo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Grupo no encontrado');
    await this.groupsRepo.remove(group);
    return { deleted: true };
  }

  async join(groupId: string, userId: string) {
    const group = await this.groupsRepo.findOne({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Grupo no encontrado');

    const existing = await this.membersRepo.findOne({
      where: { groupId, userId },
    });
    if (existing) {
      return this.findOne(groupId);
    }

    await this.membersRepo.save(
      this.membersRepo.create({ groupId, userId }),
    );
    return this.findOne(groupId);
  }

  async leave(groupId: string, userId: string) {
    const membership = await this.membersRepo.findOne({
      where: { groupId, userId },
    });
    if (!membership) {
      throw new NotFoundException('No sos miembro de este grupo');
    }
    await this.membersRepo.remove(membership);
    return { left: true };
  }
}
