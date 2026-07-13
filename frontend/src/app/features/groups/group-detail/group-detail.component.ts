import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { GroupsService } from '../../../core/services/groups.service';
import { MatchesService } from '../../../core/services/matches.service';
import { UploadService } from '../../../core/services/upload.service';
import { GroupDetail, Match, MATCH_STATUS_LABELS } from '../../../core/models';

@Component({
  selector: 'app-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './group-detail.component.html',
  styleUrl: './group-detail.component.scss',
})
export class GroupDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly groupsService = inject(GroupsService);
  private readonly matchesService = inject(MatchesService);
  private readonly uploadService = inject(UploadService);

  groupId = '';
  group: GroupDetail | null = null;
  matches: Match[] = [];
  loading = true;
  copied = false;
  statusLabels = MATCH_STATUS_LABELS;

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.groupsService.findOne(this.groupId).subscribe({
      next: (group) => {
        this.group = group;
        this.matchesService.findAll(this.groupId).subscribe({
          next: (matches) => {
            this.matches = matches;
            this.loading = false;
          },
          error: () => (this.loading = false),
        });
      },
      error: () => (this.loading = false),
    });
  }

  async copyId(): Promise<void> {
    if (!this.group) return;
    try {
      await navigator.clipboard.writeText(this.group.id);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      this.copied = false;
    }
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }

  matchAction(match: Match): string[] {
    if (match.status === 'BORRADOR') {
      return ['/groups', this.groupId, 'matches', match.id, 'setup'];
    }
    if (match.status === 'EN_VOTACION') {
      return ['/groups', this.groupId, 'matches', match.id, 'vote'];
    }
    return ['/groups', this.groupId, 'matches', match.id, 'setup'];
  }

  matchActionLabel(match: Match): string {
    if (match.status === 'BORRADOR') return 'Armar lineup';
    if (match.status === 'EN_VOTACION') return 'Votar';
    return 'Ver';
  }
}
