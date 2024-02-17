import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  KafkaService,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  TranslateService,
  FailedEntity,
} from '@zro/common';
import {
  JdpiPixPaymentInterceptor,
  JdpiPixPaymentGatewayParam,
} from '@zro/jdpi';
import {
  PixDepositRepository,
  PixDevolutionRepository,
} from '@zro/pix-payments/domain';
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  PixDevolutionDatabaseRepository,
  PixDepositDatabaseRepository,
  PixDevolutionEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-payments/infrastructure';
import {
  HandlePendingFailedPixDevolutionEventController,
  PixDevolutionEventEmitterControllerInterface,
  HandlePendingFailedPixDevolutionEventRequest,
  HandleRevertPixDevolutionEventRequest,
} from '@zro/pix-payments/interface';

export type HandlePendingFailedPixDevolutionEventKafkaRequest =
  KafkaMessage<HandlePendingFailedPixDevolutionEventRequest>;

/**
 * Failed pix devolution pending events observer.
 */
@Controller()
@ObserverController([JdpiPixPaymentInterceptor])
export class PendingFailedPixDevolutionNestObserver {
  constructor(
    private kafkaService: KafkaService,
    private translateService: TranslateService,
  ) {
    this.kafkaService.createEvents([
      KAFKA_HUB.PIX_DEVOLUTION.PENDING_FAILED.TOPAZIO_GATEWAY,
    ]);
  }

  /**
   * Handler triggered when devolution is pending.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEVOLUTION.PENDING_FAILED)
  async handlePendingFailedPixDevolutionEvent(
    @Payload('value') message: HandlePendingFailedPixDevolutionEventRequest,
    @LoggerParam(PendingFailedPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added pixDevolution event.', { value: message });

    // Select topazio gateway to add PixDevolution.
    await this.kafkaService.emit(
      KAFKA_HUB.PIX_DEVOLUTION.PENDING_FAILED.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when failed pix devolution is pending.
   *
   * @param message Event Kafka message.
   * @param devolutionRepository PixDevolution repository.
   * @param depositRepository PixDeposit repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixDevolution psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PIX_DEVOLUTION.PENDING_FAILED.TOPAZIO_GATEWAY)
  async handlePendingFailedPixDevolutionEventViaTopazio(
    @Payload('value') message: HandlePendingFailedPixDevolutionEventRequest,
    @RepositoryParam(PixDevolutionDatabaseRepository)
    devolutionRepository: PixDevolutionRepository,
    @RepositoryParam(PixDepositDatabaseRepository)
    depositRepository: PixDepositRepository,
    @EventEmitterParam(PixDevolutionEventKafkaEmitter)
    serviceEventEmitter: PixDevolutionEventEmitterControllerInterface,
    @JdpiPixPaymentGatewayParam()
    pspGateway: PixPaymentGateway,
    @LoggerParam(PendingFailedPixDevolutionNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePendingFailedPixDevolutionEventRequest(message);

    logger.info('Handle added event pending failed pix devolution.', {
      payload,
    });

    const controller = new HandlePendingFailedPixDevolutionEventController(
      logger,
      devolutionRepository,
      depositRepository,
      serviceEventEmitter,
      pspGateway,
    );

    try {
      // Call pending failed pix devolution controller.
      const result = await controller.execute(payload);

      logger.info('Failed pix devolution updated.', { result });
    } catch (error) {
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to add failed pix devolution.', { error: logError });

      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );
      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleRevertPixDevolutionEventRequest = {
        ...message,
        failed,
      };

      await this.kafkaService.emit(KAFKA_EVENTS.PIX_DEVOLUTION.REVERTED, {
        ...ctx.getMessage(),
        value,
      });
    }
  }
}
