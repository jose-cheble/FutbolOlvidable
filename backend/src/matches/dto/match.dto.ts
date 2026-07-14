import { MatchPosition, MatchStatus } from '../../common/enums';

export class CreateMatchDto {
  playedAt: string;
  playersPerTeam: number;
}

export class LineupEntryDto {
  playerId: string;
  matchTeamId: string;
  matchPosition: MatchPosition;
  fieldX: number;
  fieldY: number;
}

export class UpdateLineupDto {
  teams?: TeamUpdateDto[];
  lineups: LineupEntryDto[];
}

export class TeamUpdateDto {
  id: string;
  name?: string;
  color?: string;
}

export class UpdateMatchStatusDto {
  status: MatchStatus;
}
