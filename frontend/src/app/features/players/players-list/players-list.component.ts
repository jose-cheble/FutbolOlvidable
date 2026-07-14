import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { forkJoin } from 'rxjs';
import { PlayersService } from '../../../core/services/players.service';
import { GroupsService } from '../../../core/services/groups.service';
import { UploadService } from '../../../core/services/upload.service';
import { DefaultPosition, GroupMember, Player, POSITION_LABELS } from '../../../core/models';
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
  private readonly groupsService = inject(GroupsService);
  private readonly uploadService = inject(UploadService);

  groupId = '';
  players: Player[] = [];
  members: GroupMember[] = [];
  maxPlayers = 50;
  playerCount = 0;
  availableMembers: GroupMember[] = [];
  loading = true;
  showForm = false;
  editingPlayer: Player | null = null;
  deleteError = '';
  positionLabels = POSITION_LABELS;

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  private refreshAvailableMembers(): void {
    const taken = new Set(
      this.players
        .filter((p) => p.userId && p.id !== this.editingPlayer?.id)
        .map((p) => p.userId as string),
    );
    this.availableMembers = this.members.filter((m) => !taken.has(m.userId));
  }

  load(): void {
    this.loading = true;
    forkJoin({
      players: this.playersService.findAll(this.groupId),
      group: this.groupsService.findOne(this.groupId),
    }).subscribe({
      next: ({ players, group }) => {
        this.players = players;
        this.members = group.members;
        this.maxPlayers = group.maxPlayers;
        this.playerCount = group.playerCount;
        this.refreshAvailableMembers();
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  memberLabel(userId: string | null): string | null {
    if (!userId) return null;
    const m = this.members.find((x) => x.userId === userId);
    return m ? m.displayName : 'Usuario vinculado';
  }

  openCreate(): void {
    if (this.playerCount >= this.maxPlayers) return;
    this.editingPlayer = null;
    this.refreshAvailableMembers();
    this.showForm = true;
  }

  openEdit(player: Player): void {
    this.editingPlayer = player;
    this.refreshAvailableMembers();
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
    if (!confirm(`¿Eliminar a “${player.name}”? Se saca del roster (útil para invitados de un solo partido).`)) {
      return;
    }
    this.deleteError = '';
    this.playersService.delete(this.groupId, player.id).subscribe({
      next: () => this.load(),
      error: (err) => {
        const msg = err.error?.message;
        this.deleteError = Array.isArray(msg) ? msg.join(', ') : msg || 'No se pudo eliminar';
      },
    });
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }

  positionLabel(pos: DefaultPosition): string {
    return this.positionLabels[pos] || pos;
  }
}
