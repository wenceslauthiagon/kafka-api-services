import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  Validator,
  InjectValidator,
  ObserverController,
} from '@zro/common';
import { PixKeyRepository, KeyState } from '@zro/pix-keys/domain';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  KAFKA_EVENTS,
} from '@zro/pix-keys/infrastructure';
import {
  HandlePendingExpiredPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandlePendingExpiredPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandlePendingExpiredPixKeyEventRequestDto
  implements HandlePendingExpiredPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandlePendingExpiredPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePendingExpiredPixKeyEventKafkaRequest =
  KafkaMessage<HandlePendingExpiredPixKeyEventRequestDto>;

/**
 * PixKey events observer.
 */
@Controller()
@ObserverController()
export class PendingExpiredPixKeyNestObserver {
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Handler triggered when pending key was expired.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PENDING_EXPIRED)
  async execute(
    @Payload('value') message: HandlePendingExpiredPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PendingExpiredPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingExpiredPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle pending expired event by Pix ID.', { payload });

    const controller = new HandlePendingExpiredPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    // Call the pix controller.
    const pixKey = await controller.execute(payload);

    logger.info('Pix key updated.', { pixKey });
  }
}
