import { Inject, Injectable } from '@nestjs/common';
import type { SharedSessionResponse } from '@strive/api-interfaces';
import { SessionRepository } from './session.repository/index.js';
import { toSharedSession } from './shared-session/index.js';

@Injectable()
export class SharedSessionsService {
  constructor(@Inject(SessionRepository) private readonly sessions: SessionRepository) {}

  async get(token: string): Promise<SharedSessionResponse> {
    return toSharedSession(await this.sessions.getByShareToken(token));
  }
}
