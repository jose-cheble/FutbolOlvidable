import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AuthProvider } from '../common/enums';
import { GroupMember } from './group-member.entity';
import { Player } from './player.entity';
import { Vote } from './vote.entity';
import { MvpVote } from './mvp-vote.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({
    name: 'auth_provider',
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  authProvider: AuthProvider;

  @Column({ name: 'provider_id', type: 'varchar', nullable: true })
  providerId: string | null;

  @OneToMany(() => GroupMember, (m) => m.user)
  memberships: GroupMember[];

  @OneToMany(() => Player, (p) => p.user)
  players: Player[];

  @OneToMany(() => Vote, (v) => v.voter)
  votes: Vote[];

  @OneToMany(() => MvpVote, (v) => v.voter)
  mvpVotes: MvpVote[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
