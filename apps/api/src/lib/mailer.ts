import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

let transporter: nodemailer.Transporter | null = null;

export function getMailTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth:
        env.SMTP_USER && env.SMTP_PASSWORD
          ? {
              user: env.SMTP_USER,
              pass: env.SMTP_PASSWORD,
            }
          : undefined,
    });
    logger.info('Mail transporter initialized', { host: env.SMTP_HOST, port: env.SMTP_PORT });
  }
  return transporter;
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: MailOptions): Promise<void> {
  const mailer = getMailTransporter();
  try {
    const info = await mailer.sendMail({
      from: env.SMTP_FROM,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    logger.info('Email sent', { messageId: info.messageId, to: options.to });
  } catch (error) {
    logger.error('Failed to send email', { error, to: options.to, subject: options.subject });
    throw error;
  }
}
