import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatchesService } from '../../../core/services/matches.service';
import { VotesService } from '../../../core/services/votes.service';
import { UploadService } from '../../../core/services/upload.service';
import { AuthService } from '../../../core/services/auth.service';
import { LineupEntry, Match, MatchStatus } from '../../../core/models';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vote.component.html',
  styleUrl: './vote.component.scss',
})
export class VoteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesService = inject(MatchesService);
  private readonly votesService = inject(VotesService);
  private readonly uploadService = inject(UploadService);
  private readonly auth = inject(AuthService);
  groupId = '';
  matchId = '';
  match: Match | null = null;
  lineup: LineupEntry[] = [];
  votablePlayers: LineupEntry[] = [];
  loading = true;
  submitting = false;
  hasVoted = false;
  error = '';
  showConfirm = false;

  mvpPlayerId = '';
  scores: Record<string, number> = {};

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
        this.lineup = match.lineups || [];
        this.auth.currentUser$.subscribe((user) => {
          const selfPlayer = this.lineup.find((l) => l.player?.userId === user?.id);
          const selfId = selfPlayer?.playerId;
          this.votablePlayers = this.lineup.filter((l) => l.player && l.playerId !== selfId);
          this.votablePlayers.forEach((l) => {
            this.scores[l.playerId] = 50;
          });
        });
        this.votesService.myStatus(this.groupId, this.matchId).subscribe({
          next: (status) => {
            this.hasVoted = status.hasVoted;
            if (status.hasVoted) {
              status.votes.forEach((v) => (this.scores[v.playerId] = v.score));
              this.mvpPlayerId = status.mvpPlayerId || '';
            }
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
      },
      error: () => (this.loading = false),
    });
  }

  photoUrl(url: string | null | undefined): string | null {
    return this.uploadService.resolveUrl(url ?? null);
  }

  updateScore(playerId: string, value: number): void {
    this.scores[playerId] = value;
  }

  canSubmit(): boolean {
    return (
      !this.hasVoted &&
      this.match?.status === MatchStatus.EN_VOTACION &&
      !!this.mvpPlayerId &&
      this.votablePlayers.every(
        (p) => this.scores[p.playerId] >= 1 && this.scores[p.playerId] <= 100,
      ) &&
      !this.votablePlayers.some((p) => p.playerId === this.mvpPlayerId)
    );
  }

  requestSubmit(): void {
    if (!this.canSubmit()) return;
    this.showConfirm = true;
  }

  confirmSubmit(): void {
    if (!this.canSubmit()) return;
    this.submitting = true;
    this.error = '';
    const votes = this.votablePlayers.map((p) => ({
      playerId: p.playerId,
      score: this.scores[p.playerId],
    }));
    this.votesService.submit(this.groupId, this.matchId, votes, this.mvpPlayerId).subscribe({
      next: () => {
        this.hasVoted = true;
        this.showConfirm = false;
        this.submitting = false;
        this.router.navigate(['/groups', this.groupId]);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al enviar votos';
        this.submitting = false;
        this.showConfirm = false;
      },
    });
  }
}
