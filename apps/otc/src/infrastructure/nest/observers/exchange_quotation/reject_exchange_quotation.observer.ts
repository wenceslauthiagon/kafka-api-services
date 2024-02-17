import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RepositoryParam,
  KafkaServiceParam,
  KafkaService,
} from '@zro/common';
import { ExchangeQuotationGateway } from '@zro/otc/application';
import { ExchangeQuotationRepository } from '@zro/otc/domain';
import {
  HandleRejectExchangeQuotationEventController,
  HandleRejectExchangeQuotationEventRequest,
} from '@zro/otc/interface';
import {
  ExchangeQuotationDatabaseRepository,
  UtilServiceKafka,
  KAFKA_HUB,
} from '@zro/otc/infrastructure';
import { KAFKA_EVENTS } from '@zro/utils/infrastructure';
import {
  TopazioExchangeQuotationGatewayParam,
  TopazioExchangeQuotationInterceptor,
} from '@zro/topazio';

export type HandleRejectExchangeQuotationEventKafkaRequest =
  KafkaMessage<HandleRejectExchangeQuotationEventRequest>;

/**
 * Reject Exchange Quotation observer.
 */
@Controller()
@ObserverController([TopazioExchangeQuotationInterceptor])
export class RejectExchangeQuotationNestObserver {
  constructor(private kafkaService: KafkaService) {
    this.kafkaService.createEvents([
      KAFKA_HUB.EXCHANGE_QUOTATION.REJECT.TOPAZIO_GATEWAY,
    ]);
  }

  /**
   * Handler triggered when exchange quotation ready to reject.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(
    KAFKA_EVENTS.FEATURE_SETTING.UPDATE_CREATE_EXCHANGE_QUOTATION,
  )
  async handleUpdateFeatureExchangeQuotationEvent(
    @Payload('value') message: HandleRejectExchangeQuotationEventRequest,
    @LoggerParam(RejectExchangeQuotationNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug(
      'Received update feature exchange quotation event and call reject exchange quotations when disable feature.',
      {
        value: message,
      },
    );

    // Select topazio gateway to send reject
    await this.kafkaService.emit(
      KAFKA_HUB.EXCHANGE_QUOTATION.REJECT.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when remittance was closed successfully.
   *
   * @param message Event Kafka message.
   * @param pspGateway Exchange quotation psp.
   * @param exchangeQuotationRepository Exchange quotation repository.
   * @param utilService Util service.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.EXCHANGE_QUOTATION.REJECT.TOPAZIO_GATEWAY)
  async handleRejectExchangeQuotationEventViaTopazio(
    @Payload('value') message: HandleRejectExchangeQuotationEventRequest,
    @TopazioExchangeQuotationGatewayParam()
    pspGateway: ExchangeQuotationGateway,
    @RepositoryParam(ExchangeQuotationDatabaseRepository)
    exchangeQuotationRepository: ExchangeQuotationRepository,
    @KafkaServiceParam(UtilServiceKafka)
    utilService: UtilServiceKafka,
    @LoggerParam(RejectExchangeQuotationNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleRejectExchangeQuotationEventRequest({
      name: message.name,
    });

    logger.info('Handle reject exchange quotation event.', { payload });

    const controller = new HandleRejectExchangeQuotationEventController(
      logger,
      pspGateway,
      exchangeQuotationRepository,
      utilService,
    );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.info('Handled reject exchange quotation.');
    } catch (error) {
      logger.error('Failed to handle reject exchange quotation.', error);

      await this.kafkaService.emit(
        KAFKA_HUB.EXCHANGE_QUOTATION.REJECT.DEAD_LETTER,
        ctx.getMessage(),
      );
    }
  }
}
