import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LineupEntry, Match, MatchPosition, MatchStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class MatchesService {
  private readonly http = inject(HttpClient);

  findAll(groupId: string): Observable<Match[]> {
    return this.http.get<Match[]>(`${environment.apiUrl}/groups/${groupId}/matches`);
  }

  findOne(groupId: string, matchId: string): Observable<Match> {
    return this.http.get<Match>(
      `${environment.apiUrl}/groups/${groupId}/matches/${matchId}`,
    );
  }

  create(groupId: string, playedAt: string, playersPerTeam: number): Observable<Match> {
    return this.http.post<Match>(`${environment.apiUrl}/groups/${groupId}/matches`, {
      playedAt,
      playersPerTeam,
    });
  }

  updateLineup(
    groupId: string,
    matchId: string,
    lineups: LineupEntry[],
    teams?: { id: string; name?: string; color?: string }[],
  ): Observable<Match> {
    return this.http.put<Match>(
      `${environment.apiUrl}/groups/${groupId}/matches/${matchId}/lineup`,
      { lineups, teams },
    );
  }

  updateStatus(groupId: string, matchId: string, status: MatchStatus): Observable<Match> {
    return this.http.patch<Match>(
      `${environment.apiUrl}/groups/${groupId}/matches/${matchId}/status`,
      { status },
    );
  }

  delete(groupId: string, matchId: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(
      `${environment.apiUrl}/groups/${groupId}/matches/${matchId}`,
    );
  }
}

export type { MatchPosition };
