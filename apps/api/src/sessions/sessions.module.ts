import { Module } from '@nestjs/common';
import { SessionRepository } from './session.repository/index.js';
import { SessionsController } from './sessions.controller.js';

@Module({ controllers: [SessionsController], providers: [SessionRepository] })
export class SessionsModule {}
