import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Health check для балансувальника (ALB target group) і ECS.
  // Навмисно без запиту до БД: короткий збій БД не має «вбивати» таски.
  @Get('health')
  @SkipThrottle()
  health(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
