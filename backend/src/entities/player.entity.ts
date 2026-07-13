import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DefaultPosition } from '../common/enums';
import { Group } from './group.entity';
import { User } from './user.entity';
import { MatchLineup } from './match-lineup.entity';
import { Vote } from './vote.entity';

@Entity('players')
@Index(['groupId', 'userId'], {
  unique: true,
  where: '"user_id" IS NOT NULL',
})
export class Player {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column()
  name: string;

  @Column({ name: 'photo_url', type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({
    name: 'default_position',
    type: 'enum',
    enum: DefaultPosition,
  })
  defaultPosition: DefaultPosition;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => Group, (g) => g.players, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (u) => u.players, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @OneToMany(() => MatchLineup, (l) => l.player)
  lineups: MatchLineup[];

  @OneToMany(() => Vote, (v) => v.votedPlayer)
  receivedVotes: Vote[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
