export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
  attachments?: any[];
}

export interface IEmailService {
  sendEmail(dto: SendEmailDto): Promise<void>;
}
