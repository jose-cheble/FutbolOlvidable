import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { DefaultPosition } from '../../common/enums';

export class CreatePlayerDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string;

  @IsEnum(DefaultPosition)
  defaultPosition: DefaultPosition;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}

export class UpdatePlayerDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsEnum(DefaultPosition)
  defaultPosition?: DefaultPosition;

  @IsOptional()
  @IsString()
  photoUrl?: string | null;

  /** null = desvincular; string UUID = vincular */
  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsUUID()
  userId?: string | null;
}
