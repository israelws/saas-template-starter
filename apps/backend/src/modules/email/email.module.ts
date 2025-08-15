import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { SesEmailService } from './ses-email.service';
import { EmailServiceConfig } from './entities/email-service-config.entity';
import { EmailConfigController } from './email-config.controller';
import { OrganizationEmailConfigController } from './organization-email-config.controller';
import { EmailConfigService } from './email-config.service';
import { EmailProviderFactory } from './email-provider.factory';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([EmailServiceConfig])],
  controllers: [EmailConfigController, OrganizationEmailConfigController],
  providers: [
    EmailService,
    EmailConfigService,
    EmailProviderFactory,
    {
      provide: 'EMAIL_SERVICE',
      useClass: SesEmailService,
    },
  ],
  exports: [EmailService, EmailConfigService],
})
export class EmailModule {}
