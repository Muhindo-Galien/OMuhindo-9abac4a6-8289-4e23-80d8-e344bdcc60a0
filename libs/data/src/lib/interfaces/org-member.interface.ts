import { RoleType } from '../models/role.model';

/**
 * Summary of an org member (e.g. from GET /organizations/:orgId/members).
 * Use when listing or searching members for task assignment.
 */
export interface OrgMemberSummaryDto {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  joinedAt: Date | string;
  source?: 'direct' | 'inherited';
}
