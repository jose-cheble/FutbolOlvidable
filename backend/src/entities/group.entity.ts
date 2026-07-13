import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GroupMember } from './group-member.entity';
import { Player } from './player.entity';
import { Match } from './match.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ name: 'max_players', type: 'int' })
  maxPlayers: number;

  @OneToMany(() => GroupMember, (m) => m.group)
  members: GroupMember[];

  @OneToMany(() => Player, (p) => p.group)
  players: Player[];

  @OneToMany(() => Match, (m) => m.group)
  matches: Match[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
