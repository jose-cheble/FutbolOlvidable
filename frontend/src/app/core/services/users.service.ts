import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  updateMe(
    userId: string,
    data: { displayName?: string; photoUrl?: string | null },
  ): Observable<User> {
    return this.http.put<User>(`${environment.apiUrl}/users/${userId}`, data).pipe(
      tap((user) =>
        this.auth.patchCurrentUser({
          displayName: user.displayName,
          photoUrl: user.photoUrl,
          email: user.email,
          id: user.id,
        }),
      ),
    );
  }
}
