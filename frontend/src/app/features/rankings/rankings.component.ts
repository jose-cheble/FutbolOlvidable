import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RankingsService } from '../../core/services/rankings.service';
import { UploadService } from '../../core/services/upload.service';
import { DefaultPosition, MatchPosition, POSITION_LABELS, RankingEntry } from '../../core/models';

@Component({
  selector: 'app-rankings',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './rankings.component.html',
  styleUrl: './rankings.component.scss',
})
export class RankingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly rankingsService = inject(RankingsService);
  private readonly uploadService = inject(UploadService);

  groupId = '';
  rankings: RankingEntry[] = [];
  loading = true;
  type: 'default' | 'match' | 'mvp' = 'default';
  position = '';
  positionLabels = POSITION_LABELS;
  positions = Object.values(DefaultPosition);

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.loading = true;
    const pos = this.position ? (this.position as DefaultPosition | MatchPosition) : undefined;
    this.rankingsService.getRankings(this.groupId, this.type, pos).subscribe({
      next: (rankings) => {
        this.rankings = rankings;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onTypeChange(): void {
    if (this.type !== 'match') {
      this.position = '';
    }
    this.load();
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }
}
