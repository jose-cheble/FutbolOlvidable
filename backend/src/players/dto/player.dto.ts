import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
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

  @IsOptional()
  @IsUUID()
  userId?: string | null;
}
