import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VotesService } from './votes.service';
import { SubmitVotesDto } from './dto/vote.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Controller('groups/:groupId/matches/:matchId/votes')
@UseGuards(AuthGuard('jwt'), GroupMemberGuard)
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post()
  submit(
    @Param('groupId') groupId: string,
    @Param('matchId') matchId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: SubmitVotesDto,
  ) {
    return this.votesService.submit(groupId, matchId, user.id, dto);
  }

  @Get('me')
  myStatus(
    @Param('groupId') groupId: string,
    @Param('matchId') matchId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.votesService.myStatus(groupId, matchId, user.id);
  }
}
