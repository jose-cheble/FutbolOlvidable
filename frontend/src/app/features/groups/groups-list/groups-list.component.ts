import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GroupsService } from '../../../core/services/groups.service';
import { GROUP_PLAYERS_MAX, GROUP_PLAYERS_MIN, NAME_MAX, NAME_MIN } from '../../../core/validators/form-limits';
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
  private readonly router = inject(Router);

  groups: GroupSummary[] = [];
  loading = true;
  showCreate = false;
  showJoin = false;
  createError = '';
  joinError = '';
  joinSuccess = '';
  createdGroupId: string | null = null;
  createdGroupName: string | null = null;
  copied = false;

  createForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(NAME_MIN), Validators.maxLength(NAME_MAX)]],
    maxPlayers: [12, [Validators.required, Validators.min(GROUP_PLAYERS_MIN), Validators.max(GROUP_PLAYERS_MAX)]],
  });

  joinForm = this.fb.nonNullable.group({
    groupId: ['', [Validators.required, Validators.minLength(8)]],
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
    this.showJoin = false;
    this.createError = '';
    if (!this.showCreate) {
      this.createdGroupId = null;
      this.createdGroupName = null;
    }
  }

  toggleJoin(): void {
    this.showJoin = !this.showJoin;
    this.showCreate = false;
    this.joinError = '';
    this.joinSuccess = '';
    this.createdGroupId = null;
    this.createdGroupName = null;
  }

  createGroup(): void {
    if (this.createForm.invalid) return;
    const { name, maxPlayers } = this.createForm.getRawValue();
    this.groupsService.create(name, maxPlayers).subscribe({
      next: (group) => {
        this.createForm.reset({ name: '', maxPlayers: 12 });
        this.createdGroupId = group.id;
        this.createdGroupName = group.name;
        this.createError = '';
        this.loadGroups();
      },
      error: (err) => {
        this.createError = err.error?.message || 'Error al crear grupo';
      },
    });
  }

  joinGroup(): void {
    if (this.joinForm.invalid) return;
    const groupId = this.joinForm.getRawValue().groupId.trim();
    this.joinError = '';
    this.joinSuccess = '';

    if (this.groups.some((g) => g.id === groupId)) {
      this.router.navigate(['/groups', groupId]);
      return;
    }

    this.groupsService.join(groupId).subscribe({
      next: (group) => {
        this.joinSuccess = `Te uniste a “${group.name}”`;
        this.joinForm.reset({ groupId: '' });
        this.loadGroups();
        this.router.navigate(['/groups', group.id]);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.joinError = Array.isArray(msg)
          ? msg.join(', ')
          : msg || 'No se pudo unir al grupo. Revisá el ID.';
      },
    });
  }

  async copyId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      this.copied = false;
    }
  }

  photoUrl(url: string | null): string | null {
    return this.uploadService.resolveUrl(url);
  }
}
