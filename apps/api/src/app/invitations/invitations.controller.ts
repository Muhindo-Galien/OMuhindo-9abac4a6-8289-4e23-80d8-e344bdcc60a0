import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser, Public } from '@auth';
import { InvitationsService } from './invitations.service';
import { SendInvitationDto } from '@data';

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  @Post('send')
  @HttpCode(HttpStatus.CREATED)
  async send(
    @Body() dto: SendInvitationDto,
    @CurrentUser() user: { id: string }
  ) {
    return this.invitationsService.send(dto, user.id);
  }

  @Get('validate')
  @Public()
  async validate(@Query('token') token: string) {
    if (!token) return null;
    return this.invitationsService.validateToken(token);
  }

  @Post('accept')
  @HttpCode(HttpStatus.OK)
  async accept(
    @Body() body: { token: string },
    @CurrentUser() user: { id: string }
  ) {
    return this.invitationsService.acceptWithToken(body.token, user.id);
  }

  @Get('org/:orgId')
  async listForOrg(
    @Param('orgId') orgId: string,
    @CurrentUser() user: { id: string }
  ) {
    return this.invitationsService.listForOrg(orgId, user.id);
  }
}
