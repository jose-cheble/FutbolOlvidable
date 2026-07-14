import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, filter, take, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '../models';

const TOKEN_KEY = 'fo_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly readySubject = new BehaviorSubject(false);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.restoreSession();
  }

  whenReady(): Observable<boolean> {
    return this.readySubject.pipe(filter(Boolean), take(1));
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return this.token;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }

  register(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, {
        email,
        password,
        displayName,
      })
      .pipe(tap((res) => this.setSession(res)));
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  loadMe(): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(
      tap((user) => this.currentUserSubject.next(user)),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  /** Actualiza el usuario en memoria (p. ej. tras editar perfil). */
  patchCurrentUser(partial: Partial<User>): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    this.currentUserSubject.next({ ...current, ...partial });
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    this.currentUserSubject.next(res.user);
  }

  private restoreSession(): void {
    const token = this.getToken();
    if (!token) {
      this.readySubject.next(true);
      return;
    }

    this.loadMe().subscribe({
      next: () => this.readySubject.next(true),
      error: (err) => {
        if (err?.status === 401 || err?.status === 403) {
          this.logout();
        }
        this.readySubject.next(true);
      },
    });
  }
}
