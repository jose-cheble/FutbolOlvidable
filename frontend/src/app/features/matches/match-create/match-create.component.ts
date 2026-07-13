import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatchesService } from '../../../core/services/matches.service';

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

  form = this.fb.nonNullable.group({
    playedAt: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { playedAt } = this.form.getRawValue();
    this.matchesService.create(this.groupId, playedAt).subscribe({
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
