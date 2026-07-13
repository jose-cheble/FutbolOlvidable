import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GroupDetail, GroupSummary } from '../models';

@Injectable({ providedIn: 'root' })
export class GroupsService {
  private readonly http = inject(HttpClient);

  findAll(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(`${environment.apiUrl}/groups`);
  }

  myGroups(): Observable<GroupSummary[]> {
    return this.http.get<GroupSummary[]>(`${environment.apiUrl}/users/me/groups`);
  }

  findOne(id: string): Observable<GroupDetail> {
    return this.http.get<GroupDetail>(`${environment.apiUrl}/groups/${id}`);
  }

  create(name: string, maxPlayers: number, photoUrl?: string): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(`${environment.apiUrl}/groups`, {
      name,
      maxPlayers,
      photoUrl,
    });
  }

  update(id: string, data: Partial<{ name: string; maxPlayers: number; photoUrl: string | null }>): Observable<GroupDetail> {
    return this.http.put<GroupDetail>(`${environment.apiUrl}/groups/${id}`, data);
  }

  delete(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${environment.apiUrl}/groups/${id}`);
  }

  join(id: string): Observable<GroupDetail> {
    return this.http.post<GroupDetail>(`${environment.apiUrl}/groups/${id}/join`, {});
  }

  leave(id: string): Observable<{ left: boolean }> {
    return this.http.post<{ left: boolean }>(`${environment.apiUrl}/groups/${id}/leave`, {});
  }
}
