import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PlayersService } from '../../../core/services/players.service';
import { UploadService } from '../../../core/services/upload.service';
import { PlayerStats, POSITION_LABELS } from '../../../core/models';

@Component({
  selector: 'app-player-stats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './player-stats.component.html',
  styleUrl: './player-stats.component.scss',
})
export class PlayerStatsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly playersService = inject(PlayersService);
  private readonly uploadService = inject(UploadService);

  groupId = '';
  playerId = '';
  stats: PlayerStats | null = null;
  loading = true;
  positionLabels = POSITION_LABELS;

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.playerId = this.route.snapshot.paramMap.get('playerId')!;
    this.playersService.stats(this.groupId, this.playerId).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }
}
