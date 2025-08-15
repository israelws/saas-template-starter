export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface IEmailService {
  sendEmail(dto: SendEmailDto): Promise<void>;
}
