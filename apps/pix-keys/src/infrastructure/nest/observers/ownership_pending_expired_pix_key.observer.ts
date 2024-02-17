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
  HandleOwnershipPendingExpiredPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleOwnershipPendingExpiredPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleOwnershipPendingExpiredPixKeyEventRequestDto
  implements HandleOwnershipPendingExpiredPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandleOwnershipPendingExpiredPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleOwnershipPendingExpiredPixKeyEventKafkaRequest =
  KafkaMessage<HandleOwnershipPendingExpiredPixKeyEventRequestDto>;

/**
 * PixKey events observer.
 */
@Controller()
@ObserverController()
export class OwnershipPendingExpiredPixKeyNestObserver {
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Handler triggered when ownership pending key was expired.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.OWNERSHIP_PENDING_EXPIRED)
  async execute(
    @Payload('value') message: HandleOwnershipPendingExpiredPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(OwnershipPendingExpiredPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleOwnershipPendingExpiredPixKeyEventRequestDto(
      message,
    );
    await this.validate(payload);

    logger.info('Handle ownership pending expired event by Pix ID.', {
      payload,
    });

    const controller = new HandleOwnershipPendingExpiredPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    // Call the pix controller.
    const pixKey = await controller.execute(payload);

    logger.info('Pix key updated.', { pixKey });
  }
}
