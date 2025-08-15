import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { IEmailService, SendEmailDto } from './interfaces/email.interface';

@Injectable()
export class SesEmailService implements IEmailService {
  private readonly logger = new Logger(SesEmailService.name);
  private readonly sesClient: SESClient;
  private readonly defaultFromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');

    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.defaultFromEmail = this.configService.get<string>(
      'EMAIL_FROM_ADDRESS',
      'noreply@saasplatform.com',
    );
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      const command = new SendEmailCommand({
        Source: dto.from || this.defaultFromEmail,
        Destination: {
          ToAddresses: Array.isArray(dto.to) ? dto.to : [dto.to],
        },
        Message: {
          Subject: {
            Data: dto.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: dto.html
              ? {
                  Data: dto.html,
                  Charset: 'UTF-8',
                }
              : undefined,
            Text: dto.text
              ? {
                  Data: dto.text,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: dto.replyTo ? [dto.replyTo] : undefined,
      });

      const response = await this.sesClient.send(command);

      this.logger.log(`Email sent successfully: ${response.MessageId}`);
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
