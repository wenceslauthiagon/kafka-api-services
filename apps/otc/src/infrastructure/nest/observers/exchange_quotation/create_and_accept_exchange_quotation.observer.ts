import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  MissingEnvVarException,
  RepositoryParam,
  PrometheusService,
  KafkaServiceParam,
  KafkaService,
} from '@zro/common';
import { ExchangeQuotationGateway } from '@zro/otc/application';
import {
  ExchangeQuotationServerRepository,
  ExchangeQuotationRepository,
  RemittanceRepository,
  RemittanceExchangeQuotationRepository,
} from '@zro/otc/domain';
import {
  KAFKA_EVENTS,
  ExchangeQuotationDatabaseRepository,
  ExchangeQuotationPrometheusRepository,
  RemittanceDatabaseRepository,
  OperationServiceKafka,
  UtilServiceKafka,
  KAFKA_HUB,
  QuotationServiceKafka,
  RemittanceExchangeQuotationDatabaseRepository,
} from '@zro/otc/infrastructure';
import {
  HandleCreateAndAcceptExchangeQuotationEventController,
  HandleCreateAndAcceptExchangeQuotationEventRequest,
  HandleFailedCreateAndAcceptExchangeQuotationEventController,
  HandleFailedCreateAndAcceptExchangeQuotationEventRequest,
} from '@zro/otc/interface';
import {
  TopazioExchangeQuotationGatewayParam,
  TopazioExchangeQuotationInterceptor,
} from '@zro/topazio';

export type HandleCreateAndAcceptExchangeQuotationEventKafkaRequest =
  KafkaMessage<HandleCreateAndAcceptExchangeQuotationEventRequest>;

export interface ExchangeQuotationConfig {
  APP_ZROBANK_PARTNER_ID: number;
  APP_OPERATION_CURRENCY_SYMBOL_USD: string;
}

/**
 * Create and accept Exchange Quotation observer.
 */
@Controller()
@ObserverController([TopazioExchangeQuotationInterceptor])
export class CreateAndAcceptExchangeQuotationNestObserver {
  private zroBankPartnerId: number;
  private operationCurrencySymbolUsd: string;
  private exchangeQuotationServerRepository: ExchangeQuotationServerRepository;

  constructor(
    private configService: ConfigService<ExchangeQuotationConfig>,
    private readonly prometheusService: PrometheusService,
    private kafkaService: KafkaService,
  ) {
    this.zroBankPartnerId = Number(
      this.configService.get<number>('APP_ZROBANK_PARTNER_ID'),
    );

    this.operationCurrencySymbolUsd = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_SYMBOL_USD',
    );

    if (!this.zroBankPartnerId || !this.operationCurrencySymbolUsd) {
      throw new MissingEnvVarException([
        ...(!this.zroBankPartnerId ? ['APP_ZROBANK_PARTNER_ID'] : []),
        ...(!this.operationCurrencySymbolUsd
          ? ['APP_OPERATION_CURRENCY_SYMBOL_USD']
          : []),
      ]);
    }

    this.exchangeQuotationServerRepository =
      new ExchangeQuotationPrometheusRepository(this.prometheusService);

    this.kafkaService.createEvents([
      KAFKA_HUB.EXCHANGE_QUOTATION.CREATE.TOPAZIO_GATEWAY,
    ]);
  }

  /**
   * Handler triggered when exchange quotation is ready to be created and accepted.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.EXCHANGE_QUOTATION.READY)
  async handleExchangeQuotationEvent(
    @Payload('value')
    message: HandleCreateAndAcceptExchangeQuotationEventRequest,
    @LoggerParam(CreateAndAcceptExchangeQuotationNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received create and accept exchange quotation event.', {
      value: message,
    });

    // Select topazio gateway to send create
    await this.kafkaService.emit(
      KAFKA_HUB.EXCHANGE_QUOTATION.CREATE.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when remittance was waiting for integration successfully.
   *
   * @param message Event Kafka message.
   * @param pspGateway Exchange quotation psp.
   * @param exchangeQuotationRepository Exchange quotation repository.
   * @param remittanceRepository Remittance repository.
   * @param remittanceExchangeQuotationRepository Remittance exchange quotation repository.
   * @param operationService Operation service.
   * @param utilService Util service.
   * @param quotationService Quotation service.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.EXCHANGE_QUOTATION.CREATE.TOPAZIO_GATEWAY)
  async handleCreateAndAcceptExchangeQuotationEventViaTopazio(
    @Payload('value')
    message: HandleCreateAndAcceptExchangeQuotationEventRequest,
    @TopazioExchangeQuotationGatewayParam()
    pspGateway: ExchangeQuotationGateway,
    @RepositoryParam(ExchangeQuotationDatabaseRepository)
    exchangeQuotationRepository: ExchangeQuotationRepository,
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @RepositoryParam(RemittanceExchangeQuotationDatabaseRepository)
    remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(UtilServiceKafka)
    utilService: UtilServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(CreateAndAcceptExchangeQuotationNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message for create and accept exchange quotation.', {
      value: message,
    });

    // Parse kafka message.
    const payload = new HandleCreateAndAcceptExchangeQuotationEventRequest({
      remittanceIds: message.remittanceIds,
      currencyTag: message.currencyTag,
      receiveDate: message.receiveDate,
      sendDate: message.sendDate,
      providerId: message.providerId,
      systemId: message.systemId,
    });

    logger.info('Handle create and accept exchange quotation event.', {
      payload,
    });

    const controller =
      new HandleCreateAndAcceptExchangeQuotationEventController(
        logger,
        pspGateway,
        exchangeQuotationRepository,
        this.exchangeQuotationServerRepository,
        remittanceRepository,
        remittanceExchangeQuotationRepository,
        operationService,
        utilService,
        quotationService,
        this.zroBankPartnerId,
        this.operationCurrencySymbolUsd,
      );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.info('Handled create and accept exchange quotation.');
    } catch (error) {
      logger.error('Failed to handle create and accept exchange quotation.', {
        error,
      });

      await this.kafkaService.emit(
        KAFKA_HUB.EXCHANGE_QUOTATION.CREATE.DEAD_LETTER,
        ctx.getMessage(),
      );

      throw error;
    }
  }

  /**
   * Handler triggered when failed to create and accept exchange quotation.
   *
   * @param message Event Kafka message.
   * @param remittanceRepository Remittance repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.EXCHANGE_QUOTATION.CREATE.DEAD_LETTER)
  async handleCreateAndAcceptExchangeQuotationDeadLetterEventViaTopazio(
    @Payload('value')
    message: HandleCreateAndAcceptExchangeQuotationEventRequest,
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @LoggerParam(CreateAndAcceptExchangeQuotationNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug(
      'Received message for failed create and accept exchange quotation.',
      {
        value: message,
      },
    );

    // Parse kafka message.
    const payload =
      new HandleFailedCreateAndAcceptExchangeQuotationEventRequest(message);

    logger.info('Handle failed create and accept exchange quotation event.', {
      payload,
    });

    const controller =
      new HandleFailedCreateAndAcceptExchangeQuotationEventController(
        logger,
        remittanceRepository,
      );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.info('Handled failed create and accept exchange quotation.');
    } catch (error) {
      logger.error(
        'Failed to handle failed create and accept exchange quotation.',
        {
          error,
        },
      );
    }
  }
}
