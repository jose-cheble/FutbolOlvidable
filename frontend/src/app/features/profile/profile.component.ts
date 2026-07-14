import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UsersService } from '../../core/services/users.service';
import { UploadService } from '../../core/services/upload.service';
import { User } from '../../core/models';
import { NAME_MAX, NAME_MIN, validateImageFile } from '../../core/validators/form-limits';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly usersService = inject(UsersService);
  private readonly uploadService = inject(UploadService);
  private readonly fb = inject(FormBuilder);

  user: User | null = null;
  previewUrl: string | null = null;
  uploading = false;
  saving = false;
  error = '';
  success = '';

  form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(NAME_MIN), Validators.maxLength(NAME_MAX)]],
  });

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.form.patchValue({ displayName: user.displayName });
        this.previewUrl = this.uploadService.resolveUrl(user.photoUrl);
      }
    });
    this.auth.loadMe().subscribe({ error: () => undefined });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.user) return;

    const fileError = validateImageFile(file);
    if (fileError) {
      this.error = fileError;
      input.value = '';
      return;
    }

    this.uploading = true;
    this.error = '';
    this.success = '';
    this.uploadService.upload(file, 'users').subscribe({
      next: (res) => {
        this.usersService.updateMe(this.user!.id, { photoUrl: res.url }).subscribe({
          next: () => {
            this.uploading = false;
            this.success = 'Foto actualizada. Se usa en todos tus jugadores vinculados.';
          },
          error: (err) => {
            this.error = err.error?.message || 'Error al guardar la foto';
            this.uploading = false;
          },
        });
      },
      error: () => {
        this.error = 'Error al subir la imagen';
        this.uploading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid || !this.user) return;
    this.saving = true;
    this.error = '';
    this.success = '';
    const { displayName } = this.form.getRawValue();
    this.usersService.updateMe(this.user.id, { displayName }).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Perfil guardado';
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al guardar';
        this.saving = false;
      },
    });
  }

  removePhoto(): void {
    if (!this.user) return;
    this.error = '';
    this.usersService.updateMe(this.user.id, { photoUrl: null }).subscribe({
      next: () => {
        this.success = 'Foto eliminada';
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al quitar la foto';
      },
    });
  }
}
