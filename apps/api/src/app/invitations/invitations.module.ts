import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation, Organization, OrganizationMember, User } from '@data';
import { AuditModule } from '../audit/audit.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { MailService } from './mail.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invitation, Organization, OrganizationMember, User]),
    AuditModule,
    OrganizationsModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService, MailService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
