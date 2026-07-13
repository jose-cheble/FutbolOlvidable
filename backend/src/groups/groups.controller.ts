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
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GroupMemberGuard } from '../common/guards/group-member.guard';

@Controller('groups')
@UseGuards(AuthGuard('jwt'))
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.groupsService.findAllForUser(user.id);
  }

  @Get(':id')
  @UseGuards(GroupMemberGuard)
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(GroupMemberGuard)
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(GroupMemberGuard)
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.groupsService.join(id, user.id);
  }

  @Post(':id/leave')
  @UseGuards(GroupMemberGuard)
  leave(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.groupsService.leave(id, user.id);
  }
}
