import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import type { ActiveSessionResponse, WorkoutSession } from '@strive/api-interfaces';
import { VALIDATION_PIPE_OPTIONS } from '../common/validation-pipe.constants.js';
import { DeviceId, DeviceIdGuard } from '../device-id/index.js';
import { SaveSetResultDto } from './save-set-result.dto.js';
import { SessionIdDto } from './session-id.dto.js';
import { SessionRepository } from './session.repository/index.js';
import { SetResultParamsDto } from './set-result-params.dto.js';
import { StartSessionDto } from './start-session.dto.js';

@Controller('sessions')
@UseGuards(DeviceIdGuard)
export class SessionsController {
  constructor(@Inject(SessionRepository) private readonly sessions: SessionRepository) {}

  @Get('active')
  async active(@DeviceId() deviceId: string): Promise<ActiveSessionResponse> {
    return { session: await this.sessions.findActive(deviceId) };
  }

  @Post()
  start(
    @DeviceId() deviceId: string,
    @Body(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: StartSessionDto }))
    body: StartSessionDto,
  ): Promise<WorkoutSession> {
    return this.sessions.start(deviceId, body.workoutId);
  }

  @Get(':id')
  get(
    @DeviceId() deviceId: string,
    @Param(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: SessionIdDto }))
    params: SessionIdDto,
  ): Promise<WorkoutSession> {
    return this.sessions.getOwned(deviceId, params.id);
  }

  @Put(':id/sets/:exerciseId/:setNumber')
  saveSet(
    @DeviceId() deviceId: string,
    @Param(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: SetResultParamsDto }))
    params: SetResultParamsDto,
    @Body(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: SaveSetResultDto }))
    body: SaveSetResultDto,
  ): Promise<WorkoutSession> {
    return this.sessions.saveSetResult(
      deviceId,
      { sessionId: params.id, exerciseId: params.exerciseId, setNumber: params.setNumber },
      body,
    );
  }

  @Post(':id/finish')
  @HttpCode(200)
  finish(
    @DeviceId() deviceId: string,
    @Param(new ValidationPipe({ ...VALIDATION_PIPE_OPTIONS, expectedType: SessionIdDto }))
    params: SessionIdDto,
  ): Promise<WorkoutSession> {
    return this.sessions.finish(deviceId, params.id);
  }
}
