import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearExpiredTokens() {
    this.logger.log('Cron Job: Cleaning up expired refresh tokens...');
    try {
      const result = await this.prismaService.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });
      this.logger.log(`Cron Job: Deleted ${result.count} expired tokens.`);
    } catch (e) {
      this.logger.error('Cron Job Failed:', e);
    }
  }
}
