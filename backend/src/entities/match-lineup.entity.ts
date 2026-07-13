import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { MatchPosition } from '../common/enums';
import { MatchTeam } from './match-team.entity';
import { Player } from './player.entity';
import { Match } from './match.entity';

@Entity('match_lineups')
@Unique(['matchId', 'playerId'])
export class MatchLineup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @Column({ name: 'match_team_id' })
  matchTeamId: string;

  @Column({ name: 'player_id' })
  playerId: string;

  @Column({
    name: 'match_position',
    type: 'enum',
    enum: MatchPosition,
  })
  matchPosition: MatchPosition;

  @Column({ name: 'field_x', type: 'float', default: 50 })
  fieldX: number;

  @Column({ name: 'field_y', type: 'float', default: 50 })
  fieldY: number;

  @ManyToOne(() => Match, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => MatchTeam, (t) => t.lineups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'match_team_id' })
  matchTeam: MatchTeam;

  @ManyToOne(() => Player, (p) => p.lineups, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_id' })
  player: Player;
}
