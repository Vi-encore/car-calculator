import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// db in accessible across all app without need to write imports: [PrismaService] in every module
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
