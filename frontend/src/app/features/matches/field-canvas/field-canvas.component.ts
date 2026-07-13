import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatchesService } from '../../../core/services/matches.service';
import { PlayersService } from '../../../core/services/players.service';
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
  imports: [CommonModule, RouterLink],
  templateUrl: './field-canvas.component.html',
  styleUrl: './field-canvas.component.scss',
})
export class FieldCanvasComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesService = inject(MatchesService);
  private readonly playersService = inject(PlayersService);
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

  positions = Object.values(MatchPosition);
  positionLabels = POSITION_LABELS;

  private draggingPlayerId: string | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.matchId = this.route.snapshot.paramMap.get('matchId')!;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.matchesService.findOne(this.groupId, this.matchId).subscribe({
      next: (match) => {
        this.match = match;
        this.teams = match.teams;
        this.pins = (match.lineups || [])
          .filter((l) => l.player)
          .map((l) => ({
            playerId: l.playerId,
            player: l.player!,
            matchTeamId: l.matchTeamId,
            matchPosition: l.matchPosition,
            fieldX: l.fieldX,
            fieldY: l.fieldY,
          }));
        this.playersService.findAll(this.groupId).subscribe({
          next: (players) => {
            this.allPlayers = players;
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
      },
      error: () => (this.loading = false),
    });
  }

  availablePlayers(): Player[] {
    const used = new Set(this.pins.map((p) => p.playerId));
    return this.allPlayers.filter((p) => !used.has(p.id));
  }

  addToTeam(player: Player, teamId: string): void {
    if (this.isReadonly) return;
    const teamIndex = this.teams.findIndex((t) => t.id === teamId);
    const defaultX = teamIndex === 0 ? 25 : 75;
    const defaultY = 30 + (this.pins.filter((p) => p.matchTeamId === teamId).length * 12) % 50;
    this.pins.push({
      playerId: player.id,
      player,
      matchTeamId: teamId,
      matchPosition: player.defaultPosition as unknown as MatchPosition,
      fieldX: defaultX,
      fieldY: defaultY,
    });
  }

  removePin(playerId: string): void {
    if (this.isReadonly) return;
    this.pins = this.pins.filter((p) => p.playerId !== playerId);
  }

  updatePosition(playerId: string, position: MatchPosition): void {
    const pin = this.pins.find((p) => p.playerId === playerId);
    if (pin) pin.matchPosition = position;
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
    const svg = (event.currentTarget as Element).closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const pin = this.pins.find((p) => p.playerId === playerId);
    if (!pin) return;

    const px = (pin.fieldX / 100) * rect.width;
    const py = (pin.fieldY / 100) * rect.height;
    this.draggingPlayerId = playerId;
    this.dragOffsetX = event.clientX - rect.left - px;
    this.dragOffsetY = event.clientY - rect.top - py;
    (event.target as Element).setPointerCapture(event.pointerId);
  }

  onFieldPointerMove(event: PointerEvent): void {
    if (!this.draggingPlayerId) return;
    const svg = event.currentTarget as SVGSVGElement;
    const rect = svg.getBoundingClientRect();
    const x = ((event.clientX - rect.left - this.dragOffsetX) / rect.width) * 100;
    const y = ((event.clientY - rect.top - this.dragOffsetY) / rect.height) * 100;
    const pin = this.pins.find((p) => p.playerId === this.draggingPlayerId);
    if (pin) {
      pin.fieldX = Math.max(2, Math.min(98, x));
      pin.fieldY = Math.max(2, Math.min(98, y));
    }
  }

  onFieldPointerUp(): void {
    this.draggingPlayerId = null;
  }

  saveLineup(): void {
    if (!this.match) return;
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
    const teamACount = this.pins.filter((p) => p.matchTeamId === this.teams[0]?.id).length;
    const teamBCount = this.pins.filter((p) => p.matchTeamId === this.teams[1]?.id).length;
    if (teamACount < 1 || teamBCount < 1) {
      this.error = 'Cada equipo necesita al menos 1 jugador';
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
