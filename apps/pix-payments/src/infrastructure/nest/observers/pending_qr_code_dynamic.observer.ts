import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  KafkaService,
  LoggerParam,
  RepositoryParam,
  GatewayException,
  ObserverController,
} from '@zro/common';
import {
  JdpiPixPaymentInterceptor,
  JdpiPixPaymentGatewayParam,
} from '@zro/jdpi';
import { QrCodeDynamicRepository } from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingFailedQrCodeDynamicEventController,
  HandlePendingQrCodeDynamicEventController,
  QrCodeDynamicEventEmitterControllerInterface,
  HandlePendingQrCodeDynamicEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePendingQrCodeDynamicEventKafkaRequest =
  KafkaMessage<HandlePendingQrCodeDynamicEventRequest>;

/**
 * QrCodeDynamic events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class PendingQrCodeDynamicNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.TOPAZIO_GATEWAY,
      KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when qrCodeDynamic is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.QR_CODE_DYNAMIC.PENDING)
  async handlePendingQrCodeDynamicEvent(
    @Payload('value') message: HandlePendingQrCodeDynamicEventRequest,
    @LoggerParam(PendingQrCodeDynamicNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added QrCodeDynamic event.', { value: message });

    // Select topazio gateway to add QrCodeDynamic.
    await this.kafkaService.emit(
      KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when qrCodeDynamic is pending.
   *
   * @param message Event Kafka message.
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway QrCodeDynamic psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.TOPAZIO_GATEWAY)
  async handlePendingQrCodeDynamicEventViaTopazio(
    @Payload('value') message: HandlePendingQrCodeDynamicEventRequest,
    @RepositoryParam(QrCodeDynamicDatabaseRepository)
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    @EventEmitterParam(QrCodeDynamicEventKafkaEmitter)
    serviceEventEmitter: QrCodeDynamicEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @LoggerParam(PendingQrCodeDynamicNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingQrCodeDynamicEventRequest(message);

    logger.info('Handle added event by qrCodeDynamic ID.', { payload });

    const controller = new HandlePendingQrCodeDynamicEventController(
      logger,
      qrCodeDynamicRepository,
      serviceEventEmitter,
      pspGateway,
    );

    try {
      // Call the qrCodeDynamic controller.
      const result = await controller.execute(payload);

      logger.info('QrCodeDynamic updated.', { result });
    } catch (error) {
      logger.error(
        'Failed to add QrCodeDynamic.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.DEAD_LETTER,
          ctx.getMessage(),
        );
      }
    }
  }

  /**
   * Handle QrCodeDynamic dead letter event. QrCodeDynamics here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.QR_CODE_DYNAMIC.PENDING.DEAD_LETTER)
  async handlePendingQrCodeDynamicDeadLetterEvent(
    @Payload('value') message: HandlePendingQrCodeDynamicEventRequest,
    @RepositoryParam(QrCodeDynamicDatabaseRepository)
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    @EventEmitterParam(QrCodeDynamicEventKafkaEmitter)
    serviceEventEmitter: QrCodeDynamicEventEmitterControllerInterface,
    @LoggerParam(PendingQrCodeDynamicNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingQrCodeDynamicEventRequest(message);

    logger.info('Handle added failed event by qrCodeDynamic ID.', { payload });

    const controller = new HandlePendingFailedQrCodeDynamicEventController(
      logger,
      qrCodeDynamicRepository,
      serviceEventEmitter,
    );

    try {
      // Call the qrCodeDynamic controller.
      const result = await controller.execute(payload);

      logger.info('QrCodeDynamic key updated.', { result });
    } catch (error) {
      logger.error('Failed to add QrCodeDynamic in deadLetter.', error);

      // FIXME: Should notify IT team.
    }
  }
}
