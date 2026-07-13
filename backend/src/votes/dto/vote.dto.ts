import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class VoteEntryDto {
  @IsUUID()
  playerId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  score: number;
}

export class SubmitVotesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => VoteEntryDto)
  votes: VoteEntryDto[];

  @IsUUID()
  mvpPlayerId: string;
}
