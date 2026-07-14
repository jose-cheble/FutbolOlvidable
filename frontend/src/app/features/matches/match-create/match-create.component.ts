import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatchesService } from '../../../core/services/matches.service';
import {
  MATCH_FORMAT_PRESETS,
  PLAYERS_PER_TEAM_MAX,
  PLAYERS_PER_TEAM_MIN,
  validatePlayersPerTeam,
} from '../../../core/validators/form-limits';

@Component({
  selector: 'app-match-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './match-create.component.html',
  styleUrl: './match-create.component.scss',
})
export class MatchCreateComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matchesService = inject(MatchesService);
  private readonly fb = inject(FormBuilder);

  groupId = this.route.snapshot.paramMap.get('id')!;
  error = '';
  loading = false;
  presets = MATCH_FORMAT_PRESETS;
  playersMin = PLAYERS_PER_TEAM_MIN;
  playersMax = PLAYERS_PER_TEAM_MAX;

  form = this.fb.nonNullable.group({
    playedAt: ['', Validators.required],
    playersPerTeam: [
      7,
      [
        Validators.required,
        Validators.min(PLAYERS_PER_TEAM_MIN),
        Validators.max(PLAYERS_PER_TEAM_MAX),
      ],
    ],
  });

  formatPreview(): string {
    const n = this.form.controls.playersPerTeam.value;
    return `${n} vs ${n}`;
  }

  setPreset(n: number): void {
    this.form.controls.playersPerTeam.setValue(n);
  }

  submit(): void {
    if (this.form.invalid) return;
    const { playedAt, playersPerTeam } = this.form.getRawValue();
    const formatError = validatePlayersPerTeam(playersPerTeam);
    if (formatError) {
      this.error = formatError;
      return;
    }
    this.loading = true;
    this.error = '';
    this.matchesService.create(this.groupId, playedAt, playersPerTeam).subscribe({
      next: (match) => {
        this.router.navigate(['/groups', this.groupId, 'matches', match.id, 'setup']);
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al crear partido';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
