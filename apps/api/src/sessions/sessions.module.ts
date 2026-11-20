import { Module } from '@nestjs/common';
import { SessionRepository } from './session.repository/index.js';
import { SessionsController } from './sessions.controller.js';
import { SharedController } from './shared.controller.js';
import { SharedSessionsService } from './shared-sessions.service.js';

@Module({
  controllers: [SessionsController, SharedController],
  providers: [SessionRepository, SharedSessionsService],
})
export class SessionsModule {}
