import { Module } from '@nestjs/common';
import { IMailService } from './mail.interface';
import { GmailMailService } from './gmail-mail.service';

@Module({
  providers: [{ provide: IMailService, useClass: GmailMailService }],
  exports: [IMailService],
})
export class MailModule {}
