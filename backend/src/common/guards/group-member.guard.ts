import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GroupMember } from '../../entities/group-member.entity';

@Injectable()
export class GroupMemberGuard implements CanActivate {
  constructor(
    @InjectRepository(GroupMember)
    private readonly membersRepo: Repository<GroupMember>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string } | undefined;
    const groupId =
      request.params.groupId ||
      request.params.id ||
      request.body?.groupId;

    if (!user?.id || !groupId) {
      throw new ForbiddenException('Acceso denegado');
    }

    const membership = await this.membersRepo.findOne({
      where: { groupId, userId: user.id },
    });

    if (!membership) {
      throw new ForbiddenException('No sos miembro de este grupo');
    }

    request.groupMembership = membership;
    return true;
  }
}
