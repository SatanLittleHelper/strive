import { Controller, Get, Inject } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  type HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/index.js';
import { DATABASE_INDICATOR_KEY } from './health.constants.js';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthCheckService) private readonly health: HealthCheckService,
    @Inject(PrismaHealthIndicator) private readonly prismaIndicator: PrismaHealthIndicator,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaIndicator.pingCheck(DATABASE_INDICATOR_KEY, this.prisma),
    ]);
  }
}
