import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupsService } from '../../../core/services/groups.service';
import { UploadService } from '../../../core/services/upload.service';
import { GroupSummary } from '../../../core/models';

@Component({
  selector: 'app-groups-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './groups-list.component.html',
  styleUrl: './groups-list.component.scss',
})
export class GroupsListComponent implements OnInit {
  private readonly groupsService = inject(GroupsService);
  private readonly uploadService = inject(UploadService);
  private readonly fb = inject(FormBuilder);

  groups: GroupSummary[] = [];
  loading = true;
  showCreate = false;
  createError = '';

  createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    maxPlayers: [12, [Validators.required, Validators.min(2), Validators.max(50)]],
  });

  ngOnInit(): void {
    this.loadGroups();
  }

  loadGroups(): void {
    this.loading = true;
    this.groupsService.myGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  toggleCreate(): void {
    this.showCreate = !this.showCreate;
    this.createError = '';
  }

  createGroup(): void {
    if (this.createForm.invalid) return;
    const { name, maxPlayers } = this.createForm.getRawValue();
    this.groupsService.create(name, maxPlayers).subscribe({
      next: () => {
        this.createForm.reset({ name: '', maxPlayers: 12 });
        this.showCreate = false;
        this.loadGroups();
      },
      error: (err) => {
        this.createError = err.error?.message || 'Error al crear grupo';
      },
    });
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }
}
