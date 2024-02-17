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
  HandlePortabilityPendingExpiredPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandlePortabilityPendingExpiredPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandlePortabilityPendingExpiredPixKeyEventRequestDto
  implements HandlePortabilityPendingExpiredPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandlePortabilityPendingExpiredPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityPendingExpiredPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityPendingExpiredPixKeyEventRequestDto>;

/**
 * PixKey events observer.
 */
@Controller()
@ObserverController()
export class PortabilityPendingExpiredPixKeyNestObserver {
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Handler triggered when Portability pending key was expired.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_PENDING_EXPIRED)
  async execute(
    @Payload('value')
    message: HandlePortabilityPendingExpiredPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityPendingExpiredPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePortabilityPendingExpiredPixKeyEventRequestDto(
      message,
    );
    await this.validate(payload);

    logger.info('Handle portability pending expired event by Pix ID.', {
      payload,
    });

    const controller = new HandlePortabilityPendingExpiredPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    // Call the pix controller.
    const pixKey = await controller.execute(payload);

    logger.info('Pix key updated.', { pixKey });
  }
}
