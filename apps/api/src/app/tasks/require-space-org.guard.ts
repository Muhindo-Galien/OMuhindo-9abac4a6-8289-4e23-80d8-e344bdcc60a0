import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, isChildOrg, TASKS_REQUIRE_SPACE_MESSAGE } from '@data';

/**
 * Ensures the organization in the request (body.organizationId) is a space (child org).
 * Use on task creation so the controller rejects parent orgs before the service runs.
 * Tasks are only allowed in spaces; sites (parent orgs) cannot have tasks.
 */
@Injectable()
export class RequireSpaceOrgGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const orgId = request.body?.organizationId;
    if (!orgId) return true;

    const org = await this.orgRepo.findOne({
      where: { id: orgId },
      select: ['id', 'parentId'],
    });
    if (!org) throw new NotFoundException('Organization not found');
    if (!isChildOrg(org)) {
      throw new ForbiddenException(TASKS_REQUIRE_SPACE_MESSAGE);
    }
    return true;
  }
}
