export class CreateGroupDto {
  name: string;
  maxPlayers: number;
  photoUrl?: string;
}

export class UpdateGroupDto {
  name?: string;
  maxPlayers?: number;
  photoUrl?: string | null;
}
