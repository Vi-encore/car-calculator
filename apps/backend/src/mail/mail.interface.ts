/**
 * Абстракція надсилання пошти. Провайдер (Gmail зараз, Resend/SendGrid пізніше)
 * ховається за цим інтерфейсом — заміна не торкається бізнес-логіки.
 */
export abstract class IMailService {
  abstract sendPasswordResetCode(
    to: string,
    code: string,
    ttlMinutes: number,
  ): Promise<void>;
}
