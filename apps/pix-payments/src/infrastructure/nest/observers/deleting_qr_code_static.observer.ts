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
  HandleDeletingFailedQrCodeStaticEventController,
  HandleDeletingQrCodeStaticEventController,
  QrCodeStaticEventEmitterControllerInterface,
  HandleDeletingQrCodeStaticEventRequest,
} from '@zro/pix-payments/interface';

export type HandleDeletingQrCodeStaticEventKafkaRequest =
  KafkaMessage<HandleDeletingQrCodeStaticEventRequest>;

/**
 * QrCodeStatic events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class DeletingQrCodeStaticNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.QR_CODE_STATIC.DELETING.TOPAZIO_GATEWAY,
      KAFKA_HUB.QR_CODE_STATIC.DELETING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when qrCodeStatic is deleting.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.QR_CODE_STATIC.DELETING)
  async handleDeletingQrCodeStaticEvent(
    @Payload('value') message: HandleDeletingQrCodeStaticEventRequest,
    @LoggerParam(DeletingQrCodeStaticNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received deleting qrCodeStatic event.', { value: message });

    // Select topazio gateway to add QrCodeStatic.
    await this.kafkaService.emit(
      KAFKA_HUB.QR_CODE_STATIC.DELETING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when qrCodeStatic is deleting.
   *
   * @param message Event Kafka message.
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway Psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.QR_CODE_STATIC.DELETING.TOPAZIO_GATEWAY)
  async handleDeletingQrCodeStaticEventViaTopazio(
    @Payload('value') message: HandleDeletingQrCodeStaticEventRequest,
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    serviceEventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @LoggerParam(DeletingQrCodeStaticNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleDeletingQrCodeStaticEventRequest(message);

    logger.info('Handle deleting event by qrCodeStatic ID.', { payload });

    const controller = new HandleDeletingQrCodeStaticEventController(
      logger,
      qrCodeStaticRepository,
      serviceEventEmitter,
      pspGateway,
    );

    try {
      // Call the qrCodeStatic controller.
      const result = await controller.execute(payload);

      logger.info('QrCodeStatic deleted.', { result });
    } catch (error) {
      logger.error(
        'Failed to delete QrCodeStatic.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.QR_CODE_STATIC.DELETING.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.QR_CODE_STATIC.DELETING.DEAD_LETTER)
  async handleDeletingQrCodeStaticDeadLetterEvent(
    @Payload('value') message: HandleDeletingQrCodeStaticEventRequest,
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    serviceEventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @LoggerParam(DeletingQrCodeStaticNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleDeletingQrCodeStaticEventRequest(message);

    logger.info('Handle deleting failed event by qrCodeStatic ID.', {
      payload,
    });

    const controller = new HandleDeletingFailedQrCodeStaticEventController(
      logger,
      qrCodeStaticRepository,
      serviceEventEmitter,
    );

    try {
      // Call the qrCodeStatic controller.
      const result = await controller.execute(payload);

      logger.info('qrCodeStatic updated.', { result });
    } catch (error) {
      logger.error('Failed to add QrCodeStatic in deadLetter.', error);

      // FIXME: Should notify IT team.
    }
  }
}
