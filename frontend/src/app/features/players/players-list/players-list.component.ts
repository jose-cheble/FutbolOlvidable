import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { PlayersService } from '../../../core/services/players.service';
import { UploadService } from '../../../core/services/upload.service';
import { DefaultPosition, Player, POSITION_LABELS } from '../../../core/models';
import { PlayerFormComponent } from '../player-form/player-form.component';

@Component({
  selector: 'app-players-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, PlayerFormComponent],
  templateUrl: './players-list.component.html',
  styleUrl: './players-list.component.scss',
})
export class PlayersListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly playersService = inject(PlayersService);
  private readonly uploadService = inject(UploadService);

  groupId = '';
  players: Player[] = [];
  loading = true;
  showForm = false;
  editingPlayer: Player | null = null;
  positionLabels = POSITION_LABELS;

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.playersService.findAll(this.groupId).subscribe({
      next: (players) => {
        this.players = players;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  openCreate(): void {
    this.editingPlayer = null;
    this.showForm = true;
  }

  openEdit(player: Player): void {
    this.editingPlayer = player;
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editingPlayer = null;
  }

  onSaved(): void {
    this.closeForm();
    this.load();
  }

  deletePlayer(player: Player): void {
    if (!confirm(`¿Eliminar a ${player.name}?`)) return;
    this.playersService.delete(this.groupId, player.id).subscribe(() => this.load());
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }

  positionLabel(pos: DefaultPosition): string {
    return this.positionLabels[pos] || pos;
  }
}
