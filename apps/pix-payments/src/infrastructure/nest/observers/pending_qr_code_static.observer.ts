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
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingFailedQrCodeStaticEventController,
  HandlePendingQrCodeStaticEventController,
  QrCodeStaticEventEmitterControllerInterface,
  HandlePendingQrCodeStaticEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePendingQrCodeStaticEventKafkaRequest =
  KafkaMessage<HandlePendingQrCodeStaticEventRequest>;

/**
 * QrCodeStatic events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class PendingQrCodeStaticNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.QR_CODE_STATIC.PENDING.TOPAZIO_GATEWAY,
      KAFKA_HUB.QR_CODE_STATIC.PENDING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when qrCodeStatic is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.QR_CODE_STATIC.PENDING)
  async handlePendingQrCodeStaticEvent(
    @Payload('value') message: HandlePendingQrCodeStaticEventRequest,
    @LoggerParam(PendingQrCodeStaticNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added QrCodeStatic event.', { value: message });

    // Select topazio gateway to add QrCodeStatic.
    await this.kafkaService.emit(
      KAFKA_HUB.QR_CODE_STATIC.PENDING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when qrCodeStatic is pending.
   *
   * @param message Event Kafka message.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway QrCodeStatic psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.QR_CODE_STATIC.PENDING.TOPAZIO_GATEWAY)
  async handlePendingQrCodeStaticEventViaTopazio(
    @Payload('value') message: HandlePendingQrCodeStaticEventRequest,
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    serviceEventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @LoggerParam(PendingQrCodeStaticNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingQrCodeStaticEventRequest(message);

    logger.info('Handle added event by qrCodeStatic ID.', { payload });

    const controller = new HandlePendingQrCodeStaticEventController(
      logger,
      qrCodeStaticRepository,
      serviceEventEmitter,
      pspGateway,
    );

    try {
      // Call the qrCodeStatic controller.
      const result = await controller.execute(payload);

      logger.info('QrCodeStatic updated.', { result });
    } catch (error) {
      logger.error(
        'Failed to add QrCodeStatic.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.QR_CODE_STATIC.PENDING.DEAD_LETTER,
          ctx.getMessage(),
        );
      }
    }
  }

  /**
   * Handle QrCodeStatic dead letter event. QrCodeStatics here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.QR_CODE_STATIC.PENDING.DEAD_LETTER)
  async handlePendingQrCodeStaticDeadLetterEvent(
    @Payload('value') message: HandlePendingQrCodeStaticEventRequest,
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    serviceEventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @LoggerParam(PendingQrCodeStaticNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingQrCodeStaticEventRequest(message);

    logger.info('Handle added failed event by qrCodeStatic ID.', { payload });

    const controller = new HandlePendingFailedQrCodeStaticEventController(
      logger,
      qrCodeStaticRepository,
      serviceEventEmitter,
    );

    try {
      // Call the qrCodeStatic controller.
      const result = await controller.execute(payload);

      logger.info('QrCodeStatic key updated.', { result });
    } catch (error) {
      logger.error('Failed to add QrCodeStatic in deadLetter.', error);

      // FIXME: Should notify IT team.
    }
  }
}
