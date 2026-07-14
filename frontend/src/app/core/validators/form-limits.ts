export const NAME_MIN = 2;
export const NAME_MAX = 80;
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 72;
export const GROUP_PLAYERS_MIN = 2;
export const GROUP_PLAYERS_MAX = 50;
export const PLAYERS_PER_TEAM_MIN = 1;
export const PLAYERS_PER_TEAM_MAX = 22;
/** Atajos habituales; cualquier número entre min y max también es válido */
export const MATCH_FORMAT_PRESETS = [5, 7, 8, 11];
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export function validatePlayersPerTeam(value: number): string | null {
  if (!Number.isInteger(value) || value < PLAYERS_PER_TEAM_MIN || value > PLAYERS_PER_TEAM_MAX) {
    return `Indicá entre ${PLAYERS_PER_TEAM_MIN} y ${PLAYERS_PER_TEAM_MAX} jugadores por equipo`;
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  if (!UPLOAD_ALLOWED_TYPES.includes(file.type)) {
    return 'Solo se permiten JPG, PNG o WebP';
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return 'La imagen no puede superar 5 MB';
  }
  return null;
}
