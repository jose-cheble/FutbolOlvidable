import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MatchesService } from './matches.service';
import {
  CreateMatchDto,
  UpdateLineupDto,
  UpdateMatchStatusDto,
} from './dto/match.dto';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Controller('groups/:groupId/matches')
@UseGuards(AuthGuard('jwt'), GroupMemberGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(@Param('groupId') groupId: string, @Body() dto: CreateMatchDto) {
    return this.matchesService.create(groupId, dto);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.matchesService.findAll(groupId);
  }

  @Get(':matchId')
  findOne(
    @Param('groupId') groupId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.matchesService.findOne(groupId, matchId);
  }

  @Put(':matchId/lineup')
  updateLineup(
    @Param('groupId') groupId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateLineupDto,
  ) {
    return this.matchesService.updateLineup(groupId, matchId, dto);
  }

  @Patch(':matchId/status')
  updateStatus(
    @Param('groupId') groupId: string,
    @Param('matchId') matchId: string,
    @Body() dto: UpdateMatchStatusDto,
  ) {
    return this.matchesService.updateStatus(groupId, matchId, dto);
  }

  @Delete(':matchId')
  remove(
    @Param('groupId') groupId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.matchesService.remove(groupId, matchId);
  }
}
