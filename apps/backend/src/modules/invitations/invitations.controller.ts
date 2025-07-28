import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { ValidateInvitationDto } from './dto/validate-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CaslAbacGuard, CheckAbility } from '../abac/guards/casl-abac.guard';
import { Public } from '../auth/decorators/public.decorator';
import { Invitation } from './entities/invitation.entity';

@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, CaslAbacGuard)
  @CheckAbility({ action: 'create', subject: 'Invitation' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully' })
  @ApiResponse({ status: 409, description: 'Invitation already exists' })
  create(@Body() createInvitationDto: CreateInvitationDto, @Request() req): Promise<Invitation> {
    return this.invitationsService.create(createInvitationDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, CaslAbacGuard)
  @CheckAbility({ action: 'read', subject: 'Invitation' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all invitations' })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by organization' })
  @ApiResponse({ status: 200, description: 'List of invitations' })
  findAll(@Query('organizationId') organizationId?: string): Promise<Invitation[]> {
    return this.invitationsService.findAll(organizationId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, CaslAbacGuard)
  @CheckAbility({ action: 'read', subject: 'Invitation' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invitation by ID' })
  @ApiResponse({ status: 200, description: 'Invitation details' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  findOne(@Param('id') id: string): Promise<Invitation> {
    return this.invitationsService.findOne(id);
  }

  @Post('validate')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate an invitation token' })
  @ApiResponse({ status: 200, description: 'Validation result' })
  async validate(@Body() validateDto: ValidateInvitationDto): Promise<{ valid: boolean; invitation?: any }> {
    const result = await this.invitationsService.validate(validateDto);
    if (result.valid && result.invitation) {
      // Return limited information for public endpoint
      return {
        valid: true,
        invitation: {
          email: result.invitation.email,
          firstName: result.invitation.firstName,
          lastName: result.invitation.lastName,
          organizationName: result.invitation.organization?.name,
          expiresAt: result.invitation.expiresAt,
        },
      };
    }
    return { valid: false };
  }

  @Post('accept')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an invitation and create account' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  accept(@Body() acceptDto: AcceptInvitationDto): Promise<{ user: any; organization: any }> {
    return this.invitationsService.accept(acceptDto);
  }

  @Post(':id/resend')
  @UseGuards(JwtAuthGuard, CaslAbacGuard)
  @CheckAbility({ action: 'update', subject: 'Invitation' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend an invitation email' })
  @ApiResponse({ status: 200, description: 'Invitation resent successfully' })
  @ApiResponse({ status: 400, description: 'Cannot resend invitation' })
  resend(@Param('id') id: string): Promise<Invitation> {
    return this.invitationsService.resend(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, CaslAbacGuard)
  @CheckAbility({ action: 'delete', subject: 'Invitation' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked successfully' })
  @ApiResponse({ status: 400, description: 'Cannot revoke invitation' })
  revoke(@Param('id') id: string): Promise<Invitation> {
    return this.invitationsService.revoke(id);
  }
}