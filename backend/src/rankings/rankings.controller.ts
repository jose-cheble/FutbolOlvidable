import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RankingsService } from './rankings.service';
import { GroupMemberGuard } from '../common/guards/group-member.guard';
import { DefaultPosition, MatchPosition } from '../common/enums';

@Controller('groups/:groupId/rankings')
@UseGuards(AuthGuard('jwt'), GroupMemberGuard)
export class RankingsController {
  constructor(private readonly rankingsService: RankingsService) {}

  @Get()
  getRankings(
    @Param('groupId') groupId: string,
    @Query('type') type: 'default' | 'match' | 'mvp' = 'default',
    @Query('position') position?: DefaultPosition | MatchPosition,
  ) {
    return this.rankingsService.getRankings(groupId, type, position);
  }
}
