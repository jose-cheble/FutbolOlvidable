import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DefaultPosition, Player, PlayerStats } from '../models';

@Injectable({ providedIn: 'root' })
export class PlayersService {
  private readonly http = inject(HttpClient);

  findAll(groupId: string): Observable<Player[]> {
    return this.http.get<Player[]>(`${environment.apiUrl}/groups/${groupId}/players`);
  }

  findOne(groupId: string, playerId: string): Observable<Player> {
    return this.http.get<Player>(`${environment.apiUrl}/groups/${groupId}/players/${playerId}`);
  }

  stats(groupId: string, playerId: string): Observable<PlayerStats> {
    return this.http.get<PlayerStats>(
      `${environment.apiUrl}/groups/${groupId}/players/${playerId}/stats`,
    );
  }

  create(
    groupId: string,
    data: { name: string; defaultPosition: DefaultPosition; photoUrl?: string; userId?: string },
  ): Observable<Player> {
    return this.http.post<Player>(`${environment.apiUrl}/groups/${groupId}/players`, data);
  }

  update(
    groupId: string,
    playerId: string,
    data: Partial<{ name: string; defaultPosition: DefaultPosition; photoUrl: string | null; userId: string | null }>,
  ): Observable<Player> {
    return this.http.put<Player>(
      `${environment.apiUrl}/groups/${groupId}/players/${playerId}`,
      data,
    );
  }

  delete(groupId: string, playerId: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${environment.apiUrl}/groups/${groupId}/players/${playerId}`,
    );
  }
}
