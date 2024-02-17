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
import { KeyState } from '@zro/pix-keys/domain';
import { KAFKA_EVENTS } from '@zro/pix-keys/infrastructure';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleCanceledPixKeyQrCodeStaticEventController,
  QrCodeStaticEventEmitterControllerInterface,
  HandleCanceledPixKeyQrCodeStaticEventRequest,
} from '@zro/pix-payments/interface';

export class HandleCanceledPixKeyQrCodeStaticEventRequestDto
  implements HandleCanceledPixKeyQrCodeStaticEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandleCanceledPixKeyQrCodeStaticEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleCanceledPixKeyQrCodeStaticEventKafkaRequest =
  KafkaMessage<HandleCanceledPixKeyQrCodeStaticEventRequestDto>;

/**
 * QrCodeStatic events observer.
 */
@Controller()
@ObserverController()
export class CanceledPixKeyQrCodeStaticNestObserver {
  constructor(@InjectValidator() private validate: Validator) {}

  /**
   * Handle delete the qrCodeStatic by pixKey id when the canceled pixKey event is triggered.
   *
   * @param message Event Kafka message.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.CANCELED)
  async execute(
    @Payload('value') message: HandleCanceledPixKeyQrCodeStaticEventRequest,
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    serviceEventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @LoggerParam(CanceledPixKeyQrCodeStaticNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCanceledPixKeyQrCodeStaticEventRequestDto(
      message,
    );
    await this.validate(payload);

    logger.info("Handle canceled pixKey's qrCodeStatics event by pixKey ID.", {
      payload,
    });

    const controller = new HandleCanceledPixKeyQrCodeStaticEventController(
      qrCodeStaticRepository,
      serviceEventEmitter,
      logger,
    );

    try {
      // Call the qrCodeStatic controller.
      const result = await controller.execute(payload);

      logger.info("PixKey's qrCodeStatics updated.", { result });
    } catch (error) {
      logger.error("Failed to update pixKey's qrCodeStatics.", error);

      // FIXME: Should notify IT team.
    }
  }
}
