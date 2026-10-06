import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMailService } from './mail.interface';
import { GmailMailService } from './gmail-mail.service';
import { BrevoMailService } from './brevo-mail.service';

// Провайдер обирається через MAIL_PROVIDER: gmail (SMTP, локально) або
// brevo (HTTP-API, прод — Render free блокує SMTP-порти).
@Module({
  providers: [
    {
      provide: IMailService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): IMailService =>
        config.get<string>('MAIL_PROVIDER') === 'brevo'
          ? new BrevoMailService(config)
          : new GmailMailService(config),
    },
  ],
  exports: [IMailService],
})
export class MailModule {}
