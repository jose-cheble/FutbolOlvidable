import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VoteStatus } from '../models';

@Injectable({ providedIn: 'root' })
export class VotesService {
  private readonly http = inject(HttpClient);

  submit(
    groupId: string,
    matchId: string,
    votes: { playerId: string; score: number }[],
    mvpPlayerId: string,
  ): Observable<{ submitted: boolean; votesCount: number; mvpPlayerId: string }> {
    return this.http.post<{ submitted: boolean; votesCount: number; mvpPlayerId: string }>(
      `${environment.apiUrl}/groups/${groupId}/matches/${matchId}/votes`,
      { votes, mvpPlayerId },
    );
  }

  myStatus(groupId: string, matchId: string): Observable<VoteStatus> {
    return this.http.get<VoteStatus>(
      `${environment.apiUrl}/groups/${groupId}/matches/${matchId}/votes/me`,
    );
  }
}
