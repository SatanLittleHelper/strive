import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service/index.js';

@Global()
@Module({ providers: [PrismaService], exports: [PrismaService] })
export class PrismaModule {}
