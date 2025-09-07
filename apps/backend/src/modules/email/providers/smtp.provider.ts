import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { IEmailService, SendEmailDto } from '../interfaces/email.interface';
import { SmtpConfigDto } from '../dto/provider-configs.dto';

@Injectable()
export class SmtpProvider implements IEmailService {
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: Transporter;
  private config: SmtpConfigDto;

  constructor(config: SmtpConfigDto) {
    this.config = config;
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const transportOptions: any = {
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure, // true for 465, false for other ports
      auth: undefined as any,
      connectionTimeout: this.config.connectionTimeout || 60000,
      greetingTimeout: this.config.greetingTimeout || 30000,
      socketTimeout: this.config.socketTimeout || 120000,
    };

    // Add authentication if provided
    if (this.config.username && this.config.password) {
      transportOptions.auth = {
        user: this.config.username,
        pass: this.config.password,
      };
    }

    // Add TLS options if specified
    if (this.config.requireTls !== undefined || this.config.ignoreTls !== undefined) {
      transportOptions.tls = {};
      
      if (this.config.requireTls !== undefined) {
        transportOptions.requireTLS = this.config.requireTls;
      }
      
      if (this.config.ignoreTls) {
        transportOptions.tls.rejectUnauthorized = false;
      }
    }

    this.transporter = nodemailer.createTransport(transportOptions);
  }

  async sendEmail(dto: SendEmailDto): Promise<void> {
    try {
      const fromEmail = dto.from || this.config.fromEmail;
      const fromName = this.config.fromName || 'No Reply';
      const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

      const mailOptions: nodemailer.SendMailOptions = {
        from,
        to: dto.to,
        subject: dto.subject,
        text: dto.text,
        html: dto.html,
        cc: dto.cc,
        bcc: dto.bcc,
        replyTo: dto.replyTo,
        headers: dto.headers,
        attachments: dto.attachments,
      };

      // Remove undefined fields
      Object.keys(mailOptions).forEach(key => {
        if (mailOptions[key] === undefined) {
          delete mailOptions[key];
        }
      });

      const info = await this.transporter.sendMail(mailOptions);
      
      this.logger.log(`Email sent successfully via SMTP to ${dto.to}. Message ID: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email via SMTP: ${error.message}`, error.stack);
      
      // Provide more detailed error messages for common SMTP issues
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Failed to connect to SMTP server at ${this.config.host}:${this.config.port}. Connection refused.`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`Connection to SMTP server at ${this.config.host}:${this.config.port} timed out.`);
      } else if (error.code === 'EAUTH') {
        throw new Error('SMTP authentication failed. Please check your username and password.');
      } else if (error.responseCode === 550) {
        throw new Error('Email rejected by SMTP server. The recipient address may not exist.');
      }
      
      throw new Error(`Failed to send email via SMTP: ${error.message}`);
    }
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Verify SMTP connection
      const verified = await this.transporter.verify();
      
      if (verified) {
        return {
          success: true,
          message: `Successfully connected to SMTP server at ${this.config.host}:${this.config.port}`,
        };
      } else {
        return {
          success: false,
          message: `Failed to verify SMTP connection to ${this.config.host}:${this.config.port}`,
        };
      }
    } catch (error) {
      let errorMessage = error.message;
      
      // Provide more detailed error messages
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Connection refused to SMTP server at ${this.config.host}:${this.config.port}`;
      } else if (error.code === 'ETIMEDOUT') {
        errorMessage = `Connection timeout to SMTP server at ${this.config.host}:${this.config.port}`;
      } else if (error.code === 'EAUTH') {
        errorMessage = 'SMTP authentication failed. Please check your credentials.';
      } else if (error.code === 'ESOCKET') {
        errorMessage = `Socket error connecting to SMTP server at ${this.config.host}:${this.config.port}`;
      }
      
      return {
        success: false,
        message: `Failed to connect to SMTP server: ${errorMessage}`,
      };
    }
  }

  // Additional utility method to get SMTP server info
  async getServerInfo(): Promise<any> {
    try {
      // Some SMTP servers support EHLO command to get server capabilities
      const info = await new Promise((resolve, reject) => {
        this.transporter.verify((error, success) => {
          if (error) {
            reject(error);
          } else {
            // Get additional server info if available
            const serverInfo = {
              host: this.config.host,
              port: this.config.port,
              secure: this.config.secure,
              authenticated: !!this.config.username,
              verified: success,
            };
            resolve(serverInfo);
          }
        });
      });
      
      return info;
    } catch (error) {
      throw new Error(`Failed to get SMTP server info: ${error.message}`);
    }
  }

  // Method to update configuration and reinitialize transporter
  updateConfig(newConfig: Partial<SmtpConfigDto>): void {
    this.config = { ...this.config, ...newConfig };
    this.initializeTransporter();
    this.logger.log('SMTP configuration updated and transporter reinitialized');
  }
}