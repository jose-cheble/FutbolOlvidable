export class VoteEntryDto {
  playerId: string;
  score: number;
}

export class SubmitVotesDto {
  votes: VoteEntryDto[];
  mvpPlayerId: string;
}
