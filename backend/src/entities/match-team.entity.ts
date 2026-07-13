import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Match } from './match.entity';
import { MatchLineup } from './match-lineup.entity';

@Entity('match_teams')
export class MatchTeam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', nullable: true })
  color: string | null;

  @ManyToOne(() => Match, (m) => m.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @OneToMany(() => MatchLineup, (l) => l.matchTeam, { cascade: true })
  lineups: MatchLineup[];
}
