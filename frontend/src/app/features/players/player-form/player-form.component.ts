import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlayersService } from '../../../core/services/players.service';
import { UploadService } from '../../../core/services/upload.service';
import { DefaultPosition, Player } from '../../../core/models';

@Component({
  selector: 'app-player-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './player-form.component.html',
  styleUrl: './player-form.component.scss',
})
export class PlayerFormComponent implements OnChanges {
  @Input({ required: true }) groupId!: string;
  @Input() player: Player | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly playersService = inject(PlayersService);
  private readonly uploadService = inject(UploadService);

  positions = Object.values(DefaultPosition);
  error = '';
  loading = false;
  uploading = false;
  previewUrl: string | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    defaultPosition: [DefaultPosition.MEDIO_CAMPO, Validators.required],
    photoUrl: [''],
  });

  ngOnChanges(): void {
    if (this.player) {
      this.form.patchValue({
        name: this.player.name,
        defaultPosition: this.player.defaultPosition,
        photoUrl: this.player.photoUrl || '',
      });
      this.previewUrl = this.uploadService.resolveUrl(this.player.photoUrl);
    } else {
      this.form.reset({
        name: '',
        defaultPosition: DefaultPosition.MEDIO_CAMPO,
        photoUrl: '',
      });
      this.previewUrl = null;
    }
    this.error = '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading = true;
    this.uploadService.upload(file, 'players').subscribe({
      next: (res) => {
        this.form.patchValue({ photoUrl: res.url });
        this.previewUrl = this.uploadService.resolveUrl(res.url);
        this.uploading = false;
      },
      error: () => {
        this.error = 'Error al subir imagen';
        this.uploading = false;
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const data = this.form.getRawValue();
    const payload = {
      name: data.name,
      defaultPosition: data.defaultPosition,
      photoUrl: data.photoUrl || undefined,
    };

    const req = this.player
      ? this.playersService.update(this.groupId, this.player.id, payload)
      : this.playersService.create(this.groupId, payload);

    req.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al guardar';
        this.loading = false;
      },
    });
  }
}
