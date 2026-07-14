import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NAME_MAX, NAME_MIN, PASSWORD_MAX, PASSWORD_MIN } from '../../../core/validators/form-limits';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  error = '';
  loading = false;

  form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(NAME_MIN), Validators.maxLength(NAME_MAX)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN), Validators.maxLength(PASSWORD_MAX)]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { displayName, email, password } = this.form.getRawValue();
    this.auth.register(email, password, displayName).subscribe({
      next: () => this.router.navigate(['/groups']),
      error: (err) => {
        this.error = err.error?.message || 'Error al registrarse';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
