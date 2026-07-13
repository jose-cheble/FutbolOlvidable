import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { Group } from '../../entities/group.entity';
import { GroupMember } from '../../entities/group-member.entity';
import { Player } from '../../entities/player.entity';
import { AuthProvider, DefaultPosition } from '../../common/enums';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupsRepo: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
    @InjectRepository(Player)
    private readonly playersRepo: Repository<Player>,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.config.get('RUN_SEED') === 'true') {
      await this.run();
    }
  }

  async run() {
    await this.seedAdmin();
    await this.seedDemoData();
  }

  private async seedAdmin() {
    const email = 'admin@futbol.local';
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      this.logger.log('Usuario semilla ya existe — omitiendo');
      return existing;
    }

    const passwordHash = await bcrypt.hash('Admin123!', 10);
    const user = this.usersRepo.create({
      email,
      passwordHash,
      displayName: 'Admin Demo',
      authProvider: AuthProvider.LOCAL,
      providerId: null,
    });
    await this.usersRepo.save(user);
    this.logger.log('Usuario semilla creado: admin@futbol.local / Admin123!');
    return user;
  }

  private async seedDemoData() {
    const admin = await this.usersRepo.findOne({
      where: { email: 'admin@futbol.local' },
    });
    if (!admin) return;

    const existingGroup = await this.groupsRepo.findOne({
      where: { name: 'Los Amigos FC' },
    });
    if (existingGroup) {
      this.logger.log('Datos demo ya existen — omitiendo');
      return;
    }

    const group = await this.groupsRepo.save(
      this.groupsRepo.create({
        name: 'Los Amigos FC',
        maxPlayers: 14,
        photoUrl: null,
      }),
    );

    await this.membersRepo.save(
      this.membersRepo.create({ groupId: group.id, userId: admin.id }),
    );

    const roster: { name: string; pos: DefaultPosition; link?: boolean }[] = [
      { name: 'Admin Demo', pos: DefaultPosition.MEDIO_CAMPO, link: true },
      { name: 'Carlos López', pos: DefaultPosition.DELANTERO },
      { name: 'Martín Pérez', pos: DefaultPosition.DEFENSOR },
      { name: 'Diego Ruiz', pos: DefaultPosition.MEDIO_CAMPO },
      { name: 'Lucas Gómez', pos: DefaultPosition.DELANTERO },
      { name: 'Facundo Díaz', pos: DefaultPosition.DEFENSOR },
    ];

    for (const r of roster) {
      await this.playersRepo.save(
        this.playersRepo.create({
          groupId: group.id,
          name: r.name,
          defaultPosition: r.pos,
          photoUrl: null,
          userId: r.link ? admin.id : null,
        }),
      );
    }

    this.logger.log('Grupo demo "Los Amigos FC" creado con 6 jugadores');
  }
}
