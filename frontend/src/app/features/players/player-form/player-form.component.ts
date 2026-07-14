import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PlayersService } from '../../../core/services/players.service';
import { NAME_MAX, NAME_MIN } from '../../../core/validators/form-limits';
import { DefaultPosition, GroupMember, Player } from '../../../core/models';

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
  @Input() availableMembers: GroupMember[] = [];
  @Input() maxPlayers = 50;
  @Input() playerCount = 0;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly playersService = inject(PlayersService);

  positions = Object.values(DefaultPosition);
  error = '';
  loading = false;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(NAME_MIN), Validators.maxLength(NAME_MAX)]],
    defaultPosition: [DefaultPosition.MEDIO_CAMPO, Validators.required],
    userId: [''],
  });

  ngOnChanges(changes: SimpleChanges): void {
    // Solo rehidratar el form cuando cambia el jugador (no cuando se refresca availableMembers)
    if (!changes['player']) return;

    if (this.player) {
      this.form.patchValue({
        name: this.player.name,
        defaultPosition: this.player.defaultPosition,
        userId: this.player.userId || '',
      });
    } else {
      this.form.reset({
        name: '',
        defaultPosition: DefaultPosition.MEDIO_CAMPO,
        userId: '',
      });
    }
    this.error = '';
  }

  submit(): void {
    if (this.form.invalid) return;

    const data = this.form.getRawValue();
    const userId = (data.userId || '').trim() || null;

    if (!this.player && this.playerCount >= this.maxPlayers) {
      this.error = `El grupo ya alcanzó el máximo de ${this.maxPlayers} jugadores`;
      return;
    }

    if (userId) {
      const keepingLink = this.player?.userId === userId;
      const memberAvailable = this.availableMembers.some((m) => m.userId === userId);
      if (!keepingLink && !memberAvailable) {
        this.error = 'Ese usuario ya tiene un jugador en este grupo';
        return;
      }
    }

    this.loading = true;
    this.error = '';
    const req = this.player
      ? this.playersService.update(this.groupId, this.player.id, {
          name: data.name,
          defaultPosition: data.defaultPosition,
          userId,
        })
      : this.playersService.create(this.groupId, {
          name: data.name,
          defaultPosition: data.defaultPosition,
          userId: userId || undefined,
        });

    req.subscribe({
      next: () => {
        this.loading = false;
        this.saved.emit();
      },
      error: (err) => {
        const msg = err.error?.message;
        this.error = Array.isArray(msg) ? msg.join(', ') : msg || 'Error al guardar';
        this.loading = false;
      },
    });
  }
}
