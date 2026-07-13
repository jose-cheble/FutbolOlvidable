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

@Entity('votes')
@Unique(['matchId', 'voterId', 'votedPlayerId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @Column({ name: 'voter_id' })
  voterId: string;

  @Column({ name: 'voted_player_id' })
  votedPlayerId: string;

  @Column({ type: 'int' })
  score: number;

  @ManyToOne(() => Match, (m) => m.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => User, (u) => u.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voter_id' })
  voter: User;

  @ManyToOne(() => Player, (p) => p.receivedVotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voted_player_id' })
  votedPlayer: Player;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
