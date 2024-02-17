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
import {
  PixKeyRepository,
  KeyState,
  ClaimReasonType,
} from '@zro/pix-keys/domain';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  KAFKA_EVENTS,
} from '@zro/pix-keys/infrastructure';
import {
  HandleClaimPendingExpiredPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleClaimPendingExpiredPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleClaimPendingExpiredPixKeyEventRequestDto
  implements HandleClaimPendingExpiredPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandleClaimPendingExpiredPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleClaimPendingExpiredPixKeyEventKafkaRequest =
  KafkaMessage<HandleClaimPendingExpiredPixKeyEventRequestDto>;

/**
 * PixKey events observer.
 */
@Controller()
@ObserverController()
export class ClaimPendingExpiredPixKeyNestObserver {
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Handler triggered when claim pending key was expired.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.CLAIM_PENDING_EXPIRED)
  async execute(
    @Payload('value') message: HandleClaimPendingExpiredPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ClaimPendingExpiredPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClaimPendingExpiredPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle claim pending expired event by Pix ID.', {
      payload,
    });

    const controller = new HandleClaimPendingExpiredPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    // Call the pix controller.
    const pixKey = await controller.execute(payload);

    logger.info('Pix key updated.', { pixKey });
  }
}
