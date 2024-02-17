import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  Validator,
  InjectValidator,
  ObserverController,
} from '@zro/common';
import {
  PixKeyRepository,
  KeyState,
  PixKeyHistoryRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyDatabaseRepository,
  PixKeyHistoryDatabaseRepository,
  KAFKA_EVENTS,
} from '@zro/pix-keys/infrastructure';
import {
  HandleHistoryPixKeyEventController,
  HandleHistoryPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleHistoryPixKeyEventRequestDto
  implements HandleHistoryPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandleHistoryPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleHistoryPixKeyEventKafkaRequest =
  KafkaMessage<HandleHistoryPixKeyEventRequestDto>;

/**
 * History events observer.
 */
@Controller()
@ObserverController()
export class HistoryPixKeyNestObserver {
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Handler triggered when history state event was sent.
   *
   * @param message Event Kafka message.
   * @param logger Global logger instance.
   * @param pixKeyRepository Pix key repository.
   * @param pixKeyHistoryRepository Pix key history repository.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.STATE_HISTORY)
  async handleHistoryPixKeyEvent(
    @Payload('value') message: HandleHistoryPixKeyEventRequest,
    @LoggerParam(HistoryPixKeyNestObserver)
    logger: Logger,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyHistoryDatabaseRepository)
    pixKeyHistoryRepository: PixKeyHistoryRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleHistoryPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle history event.', { payload });

    const controller = new HandleHistoryPixKeyEventController(
      logger,
      pixKeyRepository,
      pixKeyHistoryRepository,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('History created.', { pixKey });
    } catch (error) {
      logger.error('Failed to create history.', error);
    }
  }
}
