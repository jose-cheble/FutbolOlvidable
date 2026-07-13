import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlayersService } from './players.service';
import { CreatePlayerDto, UpdatePlayerDto } from './dto/player.dto';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Controller('groups/:groupId/players')
@UseGuards(AuthGuard('jwt'), GroupMemberGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  create(@Param('groupId') groupId: string, @Body() dto: CreatePlayerDto) {
    return this.playersService.create(groupId, dto);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.playersService.findAll(groupId);
  }

  @Get(':playerId')
  findOne(
    @Param('groupId') groupId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.playersService.findOne(groupId, playerId);
  }

  @Get(':playerId/stats')
  stats(
    @Param('groupId') groupId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.playersService.stats(groupId, playerId);
  }

  @Put(':playerId')
  update(
    @Param('groupId') groupId: string,
    @Param('playerId') playerId: string,
    @Body() dto: UpdatePlayerDto,
  ) {
    return this.playersService.update(groupId, playerId, dto);
  }

  @Delete(':playerId')
  remove(
    @Param('groupId') groupId: string,
    @Param('playerId') playerId: string,
  ) {
    return this.playersService.remove(groupId, playerId);
  }
}
