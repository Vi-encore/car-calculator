import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // Creating connection pool with standard driver-pg
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    // Giving that pool to Prisma pool
    const adapter = new PrismaPg(pool);

    // Giving adapter to standard PrismaClient class
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
