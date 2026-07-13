export enum DefaultPosition {
  DELANTERO = 'DELANTERO',
  MEDIO_CAMPO = 'MEDIO_CAMPO',
  DEFENSOR = 'DEFENSOR',
}

export enum MatchPosition {
  DELANTERO = 'DELANTERO',
  MEDIO_CAMPO = 'MEDIO_CAMPO',
  DEFENSOR = 'DEFENSOR',
}

export enum MatchStatus {
  BORRADOR = 'BORRADOR',
  EN_VOTACION = 'EN_VOTACION',
  CERRADO = 'CERRADO',
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoUrl?: string | null;
  authProvider?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface GroupSummary {
  id: string;
  name: string;
  photoUrl: string | null;
  maxPlayers: number;
  joinedAt?: string;
  avgScore?: number | null;
  matchesPlayed?: number;
  playerId?: string | null;
}

export interface GroupMember {
  userId: string;
  displayName: string;
  email: string;
  joinedAt: string;
}

export interface GroupDetail {
  id: string;
  name: string;
  photoUrl: string | null;
  maxPlayers: number;
  playerCount: number;
  members: GroupMember[];
  createdAt: string;
}

export interface Player {
  id: string;
  groupId: string;
  name: string;
  photoUrl: string | null;
  defaultPosition: DefaultPosition;
  userId: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchTeam {
  id: string;
  matchId: string;
  name: string;
  color: string;
}

export interface LineupEntry {
  id?: string;
  playerId: string;
  matchTeamId: string;
  matchPosition: MatchPosition;
  fieldX: number;
  fieldY: number;
  player?: Player | null;
  teamName?: string;
  teamColor?: string;
}

export interface Match {
  id: string;
  groupId: string;
  playedAt: string;
  status: MatchStatus;
  teams: MatchTeam[];
  lineups?: LineupEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PlayerStats {
  player: Player;
  matchesPlayed: number;
  avgScore: number | null;
  totalVotes: number;
  bestMatchAvg: number | null;
  mvpCount: number;
  recentForm: { matchId: string; playedAt: string; avg: number }[];
}

export interface RankingEntry {
  rank: number;
  playerId: string;
  name: string;
  photoUrl: string | null;
  defaultPosition?: DefaultPosition;
  matchPosition?: string;
  avgScore?: number;
  matchesPlayed?: number;
  votesReceived?: number;
  mvpCount?: number;
}

export interface VoteStatus {
  hasVoted: boolean;
  votes: { playerId: string; score: number }[];
  mvpPlayerId: string | null;
}

export const POSITION_LABELS: Record<string, string> = {
  DELANTERO: 'Delantero',
  MEDIO_CAMPO: 'Medio campo',
  DEFENSOR: 'Defensor',
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  [MatchStatus.BORRADOR]: 'Borrador',
  [MatchStatus.EN_VOTACION]: 'En votación',
  [MatchStatus.CERRADO]: 'Cerrado',
};
