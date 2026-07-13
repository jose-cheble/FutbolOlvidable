import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MatchPosition, MatchStatus } from '../../common/enums';

export class CreateMatchDto {
  @IsDateString()
  playedAt: string;
}

export class LineupEntryDto {
  @IsUUID()
  playerId: string;

  @IsUUID()
  matchTeamId: string;

  @IsEnum(MatchPosition)
  matchPosition: MatchPosition;

  @IsNumber()
  @Min(0)
  @Max(100)
  fieldX: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  fieldY: number;
}

export class UpdateLineupDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamUpdateDto)
  teams?: TeamUpdateDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineupEntryDto)
  lineups: LineupEntryDto[];
}

export class TeamUpdateDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateMatchStatusDto {
  @IsEnum(MatchStatus)
  status: MatchStatus;
}
