import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Player } from './player.entity';
import { Match } from './match.entity';

@Entity('mvp_votes')
@Unique(['matchId', 'voterId'])
export class MvpVote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @Column({ name: 'voter_id' })
  voterId: string;

  @Column({ name: 'mvp_player_id' })
  mvpPlayerId: string;

  @ManyToOne(() => Match, (m) => m.mvpVotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => User, (u) => u.mvpVotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voter_id' })
  voter: User;

  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mvp_player_id' })
  mvpPlayer: Player;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
