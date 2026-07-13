import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);

  upload(file: File, type: 'players' | 'groups' | 'users' = 'players'): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(
      `${environment.apiUrl}/upload?type=${type}`,
      formData,
    );
  }

  resolveUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('/uploads')) return url;
    return `/uploads/${url.replace(/^\//, '')}`;
  }
}
