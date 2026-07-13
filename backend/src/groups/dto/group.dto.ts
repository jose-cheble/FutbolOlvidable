import {
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsInt()
  @Min(2)
  @Max(50)
  maxPlayers: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(50)
  maxPlayers?: number;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;
}
