import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DefaultPosition, MatchPosition, RankingEntry } from '../models';

@Injectable({ providedIn: 'root' })
export class RankingsService {
  private readonly http = inject(HttpClient);

  getRankings(
    groupId: string,
    type: 'default' | 'match' | 'mvp' = 'default',
    position?: DefaultPosition | MatchPosition,
  ): Observable<RankingEntry[]> {
    let params = new HttpParams().set('type', type);
    if (position) {
      params = params.set('position', position);
    }
    return this.http.get<RankingEntry[]>(
      `${environment.apiUrl}/groups/${groupId}/rankings`,
      { params },
    );
  }
}
