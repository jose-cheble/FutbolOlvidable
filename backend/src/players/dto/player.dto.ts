import { DefaultPosition } from '../../common/enums';

export class CreatePlayerDto {
  name: string;
  defaultPosition: DefaultPosition;
  photoUrl?: string;
  userId?: string;
}

export class UpdatePlayerDto {
  name?: string;
  defaultPosition?: DefaultPosition;
  photoUrl?: string | null;
  userId?: string | null;
}
