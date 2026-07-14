import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MatchStatus } from '../common/enums';
import { Group } from './group.entity';
import { MatchTeam } from './match-team.entity';
import { Vote } from './vote.entity';
import { MvpVote } from './mvp-vote.entity';

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @Column({ name: 'played_at', type: 'date' })
  playedAt: string;

  @Column({ name: 'players_per_team', type: 'int', default: 7 })
  playersPerTeam: number;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.BORRADOR,
  })
  status: MatchStatus;

  @ManyToOne(() => Group, (g) => g.matches, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @OneToMany(() => MatchTeam, (t) => t.match, { cascade: true })
  teams: MatchTeam[];

  @OneToMany(() => Vote, (v) => v.match)
  votes: Vote[];

  @OneToMany(() => MvpVote, (v) => v.match)
  mvpVotes: MvpVote[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
