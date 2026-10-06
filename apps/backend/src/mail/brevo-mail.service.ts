import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMailService } from './mail.interface';
import { passwordResetEmail } from './templates/password-reset.template';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Надсилання пошти через HTTP-API Brevo (а не SMTP).
 * Render free-тариф блокує вихідні SMTP-порти, а HTTPS — ні, тож на проді
 * використовуємо цей провайдер. Sender має бути верифікований у Brevo.
 */
@Injectable()
export class BrevoMailService extends IMailService {
  private readonly logger = new Logger(BrevoMailService.name);
  private readonly apiKey: string;
  private readonly sender: { email: string; name?: string };

  constructor(private readonly configService: ConfigService) {
    super();
    this.apiKey = this.configService.get<string>('BREVO_API_KEY') ?? '';
    this.sender = parseSender(
      this.configService.get<string>('MAIL_FROM') ?? '',
    );
  }

  async sendPasswordResetCode(
    to: string,
    code: string,
    ttlMinutes: number,
  ): Promise<void> {
    const { subject, text, html } = passwordResetEmail(code, ttlMinutes);

    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': this.apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: this.sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      this.logger.error(`Brevo send failed: ${res.status} ${detail}`);
      throw new InternalServerErrorException('Не вдалося надіслати лист');
    }
    this.logger.log(`Password-reset code sent to ${to}`);
  }
}

/** Розбирає MAIL_FROM виду `Name <email>` або `email` на {name, email}. */
function parseSender(from: string): { email: string; name?: string } {
  const match = /^\s*(.*?)\s*<([^>]+)>\s*$/.exec(from);
  if (match) {
    return { name: match[1] || undefined, email: match[2].trim() };
  }
  return { email: from.trim() };
}
