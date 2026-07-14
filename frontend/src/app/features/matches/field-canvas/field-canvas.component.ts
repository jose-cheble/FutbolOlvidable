import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatchesService } from '../../../core/services/matches.service';
import { UploadService } from '../../../core/services/upload.service';
import {
  LineupEntry,
  Match,
  MatchPosition,
  MatchStatus,
  MatchTeam,
  Player,
  POSITION_LABELS,
} from '../../../core/models';

interface FieldPin {
  playerId: string;
  player: Player;
  matchTeamId: string;
  matchPosition: MatchPosition;
  fieldX: number;
  fieldY: number;
}

@Component({
  selector: 'app-field-canvas',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './field-canvas.component.html',
  styleUrl: './field-canvas.component.scss',
})
export class FieldCanvasComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesService = inject(MatchesService);
  private readonly uploadService = inject(UploadService);

  groupId = '';
  matchId = '';
  match: Match | null = null;
  allPlayers: Player[] = [];
  pins: FieldPin[] = [];
  teams: MatchTeam[] = [];
  loading = true;
  saving = false;
  starting = false;
  error = '';
  success = '';
  isPortrait = false;

  positions = Object.values(MatchPosition);
  positionLabels = POSITION_LABELS;

  private draggingPlayerId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private readonly portraitQuery = window.matchMedia('(max-width: 768px)');

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.matchId = this.route.snapshot.paramMap.get('matchId')!;
    this.updatePortrait();
    this.portraitQuery.addEventListener('change', this.onPortraitChange);
    this.load();
  }

  ngOnDestroy(): void {
    this.portraitQuery.removeEventListener('change', this.onPortraitChange);
  }

  private onPortraitChange = (): void => {
    this.updatePortrait();
  };

  @HostListener('window:resize')
  onResize(): void {
    this.updatePortrait();
  }

  private updatePortrait(): void {
    this.isPortrait = this.portraitQuery.matches;
  }

  load(): void {
    this.loading = true;
    this.matchesService.findOne(this.groupId, this.matchId).subscribe({
      next: (match) => {
        this.match = match;
        this.teams = match.teams;
        this.allPlayers = match.roster ?? [];
        this.pins = this.pinsFromMatch(match);
        this.mergeRosterData();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  private pinsFromMatch(match: Match): FieldPin[] {
    return (match.lineups || [])
      .filter((l) => l.player)
      .map((l) => ({
        playerId: l.playerId,
        player: l.player!,
        matchTeamId: l.matchTeamId,
        matchPosition: l.matchPosition,
        fieldX: l.fieldX,
        fieldY: l.fieldY,
      }));
  }

  private mergeRosterData(): void {
    const rosterById = new Map(this.allPlayers.map((p) => [p.id, p]));
    for (const pin of this.pins) {
      const roster = rosterById.get(pin.playerId);
      pin.player = {
        ...pin.player,
        photoUrl: roster?.photoUrl ?? pin.player.photoUrl ?? null,
        avgScore: roster?.avgScore ?? pin.player.avgScore ?? null,
      };
    }
  }

  availablePlayers(): Player[] {
    const used = new Set(this.pins.map((p) => p.playerId));
    return this.allPlayers.filter((p) => !used.has(p.id));
  }

  maxPerTeam(): number {
    return this.match?.playersPerTeam ?? 7;
  }

  teamCount(teamId: string): number {
    return this.pins.filter((p) => p.matchTeamId === teamId).length;
  }

  teamIsFull(teamId: string): boolean {
    return this.teamCount(teamId) >= this.maxPerTeam();
  }

  private validateTeamLimits(): string | null {
    const max = this.maxPerTeam();
    for (const team of this.teams) {
      const count = this.teamCount(team.id);
      if (count > max) {
        return `${team.name} supera el máximo de ${max} jugadores`;
      }
    }
    return null;
  }

  /**
   * Coordenadas guardadas en cancha horizontal (A arco izquierdo, B derecho).
   * fieldY: 0 = arriba, 100 = abajo — con arco a la izquierda, abajo = izquierda del arquero.
   * Al rotar a vertical, profundidad = fieldX, lateral = 100 - fieldY.
   */
  pinDisplayX(pin: FieldPin): number {
    return this.isPortrait ? 100 - pin.fieldY : pin.fieldX;
  }

  pinDisplayY(pin: FieldPin): number {
    return this.isPortrait ? pin.fieldX : pin.fieldY;
  }

  private displayToStored(displayX: number, displayY: number): { fieldX: number; fieldY: number } {
    if (this.isPortrait) {
      return { fieldX: displayY, fieldY: 100 - displayX };
    }
    return { fieldX: displayX, fieldY: displayY };
  }

  private clampFieldCoord(value: number): number {
    return Math.max(2, Math.min(98, value));
  }

  playerAvgScore(playerId: string): string {
    const player =
      this.allPlayers.find((p) => p.id === playerId) ||
      this.pins.find((p) => p.playerId === playerId)?.player;
    if (player?.avgScore == null) return '—';
    return String(player.avgScore);
  }

  addToTeam(player: Player, teamId: string): void {
    if (this.isReadonly || this.teamIsFull(teamId)) return;
    const teamIndex = this.teams.findIndex((t) => t.id === teamId);
    const teamCount = this.teamCount(teamId);
    const spread = 55 + (teamCount * 9) % 35;
    const fieldX = teamIndex === 0 ? 18 + (teamCount * 7) % 22 : 72 + (teamCount * 7) % 22;
    const fieldY = spread;
    this.pins.push({
      playerId: player.id,
      player,
      matchTeamId: teamId,
      matchPosition: player.defaultPosition as unknown as MatchPosition,
      fieldX,
      fieldY,
    });
    this.error = '';
  }

  removePin(playerId: string): void {
    if (this.isReadonly) return;
    this.pins = this.pins.filter((p) => p.playerId !== playerId);
  }

  updatePosition(playerId: string, position: string): void {
    const pin = this.pins.find((p) => p.playerId === playerId);
    if (pin) pin.matchPosition = position as MatchPosition;
  }

  get isReadonly(): boolean {
    return this.match?.status !== MatchStatus.BORRADOR;
  }

  teamColor(teamId: string): string {
    return this.teams.find((t) => t.id === teamId)?.color || '#fff';
  }

  teamName(teamId: string): string {
    return this.teams.find((t) => t.id === teamId)?.name || '';
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }

  onPinPointerDown(event: PointerEvent, playerId: string): void {
    if (this.isReadonly) return;
    event.preventDefault();
    event.stopPropagation();
    const wrap = (event.currentTarget as Element).closest('.pitch-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const pin = this.pins.find((p) => p.playerId === playerId);
    if (!pin) return;

    const displayX = this.pinDisplayX(pin);
    const displayY = this.pinDisplayY(pin);
    const px = (displayX / 100) * rect.width;
    const py = (displayY / 100) * rect.height;
    this.draggingPlayerId = playerId;
    this.dragOffsetX = event.clientX - rect.left - px;
    this.dragOffsetY = event.clientY - rect.top - py;
    (event.currentTarget as Element).setPointerCapture(event.pointerId);
  }

  onFieldPointerMove(event: PointerEvent): void {
    if (!this.draggingPlayerId) return;
    const wrap = event.currentTarget as HTMLElement;
    const rect = wrap.getBoundingClientRect();
    const displayX = ((event.clientX - rect.left - this.dragOffsetX) / rect.width) * 100;
    const displayY = ((event.clientY - rect.top - this.dragOffsetY) / rect.height) * 100;
    const stored = this.displayToStored(displayX, displayY);
    const pin = this.pins.find((p) => p.playerId === this.draggingPlayerId);
    if (pin) {
      pin.fieldX = this.clampFieldCoord(stored.fieldX);
      pin.fieldY = this.clampFieldCoord(stored.fieldY);
    }
  }

  onFieldPointerUp(): void {
    this.draggingPlayerId = null;
  }

  saveLineup(): void {
    if (!this.match) return;
    if (this.isReadonly) return;
    const limitError = this.validateTeamLimits();
    if (limitError) {
      this.error = limitError;
      return;
    }
    this.saving = true;
    this.error = '';
    this.success = '';
    const lineups: LineupEntry[] = this.pins.map((p) => ({
      playerId: p.playerId,
      matchTeamId: p.matchTeamId,
      matchPosition: p.matchPosition,
      fieldX: Math.round(p.fieldX * 10) / 10,
      fieldY: Math.round(p.fieldY * 10) / 10,
    }));
    this.matchesService.updateLineup(this.groupId, this.matchId, lineups).subscribe({
      next: (match) => {
        this.match = match;
        this.allPlayers = match.roster ?? this.allPlayers;
        this.pins = this.pinsFromMatch(match);
        this.mergeRosterData();
        this.saving = false;
        this.success = 'Lineup guardado';
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al guardar';
        this.saving = false;
      },
    });
  }

  startVoting(): void {
    if (!this.match) return;
    if (this.match.status !== MatchStatus.BORRADOR) {
      this.error = 'El partido ya no está en borrador';
      return;
    }
    for (const team of this.teams) {
      if (this.teamCount(team.id) < 1) {
        this.error = 'Cada equipo necesita al menos 1 jugador';
        return;
      }
    }
    const limitError = this.validateTeamLimits();
    if (limitError) {
      this.error = limitError;
      return;
    }
    if (!confirm('¿Iniciar votación? No podrás editar el lineup.')) return;
    this.starting = true;
    this.error = '';
    this.matchesService
      .updateStatus(this.groupId, this.matchId, MatchStatus.EN_VOTACION)
      .subscribe({
        next: () => {
          this.router.navigate(['/groups', this.groupId, 'matches', this.matchId, 'vote']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al iniciar votación';
          this.starting = false;
        },
        complete: () => (this.starting = false),
      });
  }
}
