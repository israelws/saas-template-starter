import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailConfigService } from './email-config.service';
import {
  CreateEmailServiceConfigDto,
  UpdateEmailServiceConfigDto,
  TestEmailServiceDto,
} from './dto/email-service-config.dto';
import { EmailServiceProvider } from './entities/email-service-config.entity';
import { CaslAbacGuard, CheckAbility } from '../abac/guards/casl-abac.guard';

@ApiTags('organization-email-config')
@Controller('organizations/:organizationId/email-config')
@UseGuards(JwtAuthGuard, CaslAbacGuard)
@ApiBearerAuth()
export class OrganizationEmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  @Get()
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @ApiOperation({ summary: 'Get all email service configurations for organization' })
  @ApiResponse({ status: 200, description: 'List of email service configurations' })
  findAll(@Param('organizationId') organizationId: string) {
    return this.emailConfigService.findAll(organizationId);
  }

  @Get(':provider')
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @ApiOperation({ summary: 'Get email service configuration by provider for organization' })
  @ApiResponse({ status: 200, description: 'Email service configuration' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async findOne(
    @Param('organizationId') organizationId: string,
    @Param('provider') provider: EmailServiceProvider,
  ) {
    const config = await this.emailConfigService.findOneOrNull(provider, organizationId);
    if (!config) {
      // Return an empty config structure instead of 404 for UI
      return {
        provider,
        organizationId,
        enabled: false,
        config: {},
        isDefault: false,
        isGlobalDefault: false,
      };
    }
    return config;
  }

  @Post()
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @ApiOperation({ summary: 'Create or update email service configuration for organization' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async create(
    @Param('organizationId') organizationId: string,
    @Body() createDto: CreateEmailServiceConfigDto,
  ) {
    // Check if config exists
    const existing = await this.emailConfigService.findOneOrNull(
      createDto.provider,
      organizationId,
    );
    if (existing) {
      // Update existing
      return this.emailConfigService.update(createDto.provider, createDto, organizationId);
    }
    // Create new
    return this.emailConfigService.create({
      ...createDto,
      organizationId,
    });
  }

  @Put(':provider')
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @ApiOperation({ summary: 'Update email service configuration for organization' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  update(
    @Param('organizationId') organizationId: string,
    @Param('provider') provider: EmailServiceProvider,
    @Body() updateDto: UpdateEmailServiceConfigDto,
  ) {
    return this.emailConfigService.update(provider, updateDto, organizationId);
  }

  @Delete(':provider')
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete email service configuration for organization' })
  @ApiResponse({ status: 204, description: 'Configuration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  remove(
    @Param('organizationId') organizationId: string,
    @Param('provider') provider: EmailServiceProvider,
  ) {
    return this.emailConfigService.remove(provider, organizationId);
  }

  @Post(':provider/test')
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @ApiOperation({ summary: 'Test email service configuration for organization' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  @ApiResponse({ status: 400, description: 'Test failed' })
  test(
    @Param('organizationId') organizationId: string,
    @Param('provider') provider: EmailServiceProvider,
    @Body() testDto: TestEmailServiceDto,
  ) {
    return this.emailConfigService.testConfiguration(provider, testDto.to, organizationId);
  }

  @Post(':provider/set-default')
  @CheckAbility({ action: 'update', subject: 'Organization' })
  @ApiOperation({ summary: 'Set email service as default for organization' })
  @ApiResponse({ status: 200, description: 'Default service updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  setDefault(
    @Param('organizationId') organizationId: string,
    @Param('provider') provider: EmailServiceProvider,
  ) {
    return this.emailConfigService.setDefault(provider, organizationId);
  }
}
