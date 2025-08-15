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
  Query,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { AdminOrSuperAdminGuard } from '../../common/guards/admin-or-super-admin.guard';
import { EmailConfigService } from './email-config.service';
import {
  CreateEmailServiceConfigDto,
  UpdateEmailServiceConfigDto,
  TestEmailServiceDto,
} from './dto/email-service-config.dto';
import { EmailServiceProvider } from './entities/email-service-config.entity';
import { CaslAbacGuard, CheckAbility } from '../abac/guards/casl-abac.guard';

@ApiTags('email-config')
@Controller('email-config')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailConfigController {
  constructor(private readonly emailConfigService: EmailConfigService) {}

  @Get()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Get all system-level email service configurations' })
  @ApiResponse({ status: 200, description: 'List of email service configurations' })
  findAll() {
    return this.emailConfigService.findAll();
  }

  @Get(':provider')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Get email service configuration by provider' })
  @ApiResponse({ status: 200, description: 'Email service configuration' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async findOne(@Param('provider') provider: EmailServiceProvider) {
    const config = await this.emailConfigService.findOneOrNull(provider);
    if (!config) {
      // Return an empty config structure instead of 404 for UI
      return {
        provider,
        enabled: false,
        config: {},
        isDefault: false,
        isGlobalDefault: false,
      };
    }
    return config;
  }

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Create or update email service configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  async create(@Body() createDto: CreateEmailServiceConfigDto) {
    // Check if config exists
    const existing = await this.emailConfigService.findOneOrNull(createDto.provider);
    if (existing) {
      // Update existing
      return this.emailConfigService.update(createDto.provider, createDto);
    }
    // Create new
    return this.emailConfigService.create(createDto);
  }

  @Put(':provider')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Update email service configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  update(
    @Param('provider') provider: EmailServiceProvider,
    @Body() updateDto: UpdateEmailServiceConfigDto,
  ) {
    return this.emailConfigService.update(provider, updateDto);
  }

  @Delete(':provider')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete email service configuration' })
  @ApiResponse({ status: 204, description: 'Configuration deleted successfully' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  remove(@Param('provider') provider: EmailServiceProvider) {
    return this.emailConfigService.remove(provider);
  }

  @Post(':provider/test')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Test email service configuration' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  @ApiResponse({ status: 400, description: 'Test failed' })
  test(@Param('provider') provider: EmailServiceProvider, @Body() testDto: TestEmailServiceDto) {
    return this.emailConfigService.testConfiguration(provider, testDto.to);
  }

  @Post(':provider/set-default')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Set email service as default' })
  @ApiResponse({ status: 200, description: 'Default service updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  setDefault(@Param('provider') provider: EmailServiceProvider) {
    return this.emailConfigService.setDefault(provider);
  }

  @Post(':provider/set-global-default')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Set email service as global default' })
  @ApiResponse({ status: 200, description: 'Global default service updated' })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async setGlobalDefault(@Param('provider') provider: EmailServiceProvider) {
    return this.emailConfigService.setGlobalDefault(provider);
  }
}
