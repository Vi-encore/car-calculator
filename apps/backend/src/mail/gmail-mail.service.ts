import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import { IMailService } from './mail.interface';

/** Надсилання пошти через Gmail SMTP (app-password). */
@Injectable()
export class GmailMailService extends IMailService {
  private readonly logger = new Logger(GmailMailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    super();
    const port = this.configService.get<number>('MAIL_PORT') ?? 465;
    this.transporter = createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port,
      secure: port === 465, // 465 = implicit TLS, 587 = STARTTLS
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
    this.from = this.configService.get<string>('MAIL_FROM') ?? '';
  }

  async sendPasswordResetCode(
    to: string,
    code: string,
    ttlMinutes: number,
  ): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to,
      subject: 'Код для скидання пароля — CarCalculator',
      text:
        `Ваш код для скидання пароля: ${code}\n\n` +
        `Код дійсний ${ttlMinutes} хв. Якщо ви не запитували скидання — ` +
        `просто проігноруйте цей лист.`,
      html:
        `<p>Ваш код для скидання пароля:</p>` +
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>` +
        `<p>Код дійсний ${ttlMinutes} хв. Якщо ви не запитували скидання — ` +
        `просто проігноруйте цей лист.</p>`,
    });
    this.logger.log(`Password-reset code sent to ${to}`);
  }
}
