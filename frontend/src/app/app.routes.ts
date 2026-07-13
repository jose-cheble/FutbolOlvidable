import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { GroupsListComponent } from './features/groups/groups-list/groups-list.component';
import { GroupDetailComponent } from './features/groups/group-detail/group-detail.component';
import { PlayersListComponent } from './features/players/players-list/players-list.component';
import { PlayerStatsComponent } from './features/players/player-stats/player-stats.component';
import { MatchCreateComponent } from './features/matches/match-create/match-create.component';
import { FieldCanvasComponent } from './features/matches/field-canvas/field-canvas.component';
import { VoteComponent } from './features/matches/vote/vote.component';
import { RankingsComponent } from './features/rankings/rankings.component';

import { ProfileComponent } from './features/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'groups', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'groups', component: GroupsListComponent, canActivate: [authGuard] },
  { path: 'groups/:id', component: GroupDetailComponent, canActivate: [authGuard] },
  { path: 'groups/:id/players', component: PlayersListComponent, canActivate: [authGuard] },
  { path: 'groups/:id/players/:playerId', component: PlayerStatsComponent, canActivate: [authGuard] },
  { path: 'groups/:id/matches/new', component: MatchCreateComponent, canActivate: [authGuard] },
  { path: 'groups/:id/matches/:matchId/setup', component: FieldCanvasComponent, canActivate: [authGuard] },
  { path: 'groups/:id/matches/:matchId/vote', component: VoteComponent, canActivate: [authGuard] },
  { path: 'groups/:id/rankings', component: RankingsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'groups' },
];
