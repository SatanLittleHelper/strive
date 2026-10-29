import { Inject, Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(ConfigService) config: ConfigService) {
    const adapter = new PrismaPg({ connectionString: config.getOrThrow<string>('DATABASE_URL') });
    super({ adapter });
  }

  // база — критичная зависимость: недоступность на старте должна остановить приложение;
  // $connect() с драйвер-адаптером соединение не открывает, поэтому проверяем запросом
  async onModuleInit(): Promise<void> {
    await this.$connect();
    await this.$queryRaw`SELECT 1`;
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
