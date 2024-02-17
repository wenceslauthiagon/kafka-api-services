import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  KafkaServiceParam,
  LoggerParam,
  MissingEnvVarException,
  ObserverController,
  RepositoryParam,
} from '@zro/common';
import {
  WalletAccountRepository,
  OperationRepository,
  CurrencyRepository,
} from '@zro/operations/domain';
import { OtcService } from '@zro/operations/application';
import {
  HandleCalculateCryptoAvgPriceEventRequest,
  HandleCalculateCryptoAvgPriceEventController,
} from '@zro/operations/interface';
import {
  KAFKA_EVENTS,
  WalletAccountDatabaseRepository,
  OperationDatabaseRepository,
  CurrencyDatabaseRepository,
  OtcServiceKafka,
} from '@zro/operations/infrastructure';

export type HandleCalculateCryptoAvgPriceEventKafkaRequest =
  KafkaMessage<HandleCalculateCryptoAvgPriceEventRequest>;

export interface CalculateCryptoAvgPriceConfig {
  APP_OPERATION_CRYPTO_TRANSACTION_TAGS_FILTER: string;
}

/**
 * Calculate crypto average price events observer.
 */
@Controller()
@ObserverController()
export class CalculateCryptoAvgPriceNestObserver {
  private readonly appOperationCryptoTransactionTagsFilter: string;

  constructor(
    private configService: ConfigService<CalculateCryptoAvgPriceConfig>,
  ) {
    this.appOperationCryptoTransactionTagsFilter =
      this.configService.get<string>(
        'APP_OPERATION_CRYPTO_TRANSACTION_TAGS_FILTER',
      );

    if (!this.appOperationCryptoTransactionTagsFilter) {
      throw new MissingEnvVarException([
        'APP_OPERATION_CRYPTO_TRANSACTION_TAGS_FILTER',
      ]);
    }
  }
  /**
   * Handler triggered when operation event is accepted.
   *
   * @param message Event Kafka message.
   * @param userRepository User repository.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.OPERATION.ACCEPTED)
  async execute(
    @Payload('value')
    message: HandleCalculateCryptoAvgPriceEventRequest,
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(CurrencyDatabaseRepository)
    currencyRepository: CurrencyRepository,
    @KafkaServiceParam(OtcServiceKafka)
    otcService: OtcService,
    @LoggerParam(CalculateCryptoAvgPriceNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', {
      value: message,
    });

    // Parse kafka message.
    const payload = new HandleCalculateCryptoAvgPriceEventRequest(message);

    logger.info('Calculate avg crypto price event payload.', {
      payload,
    });

    const controller = new HandleCalculateCryptoAvgPriceEventController(
      logger,
      walletAccountRepository,
      operationRepository,
      currencyRepository,
      otcService,
      this.appOperationCryptoTransactionTagsFilter,
    );

    try {
      // Call handle calculate avg crypto controller.
      await controller.execute(payload);

      logger.info('Calculate avg crypto price event handled.');
    } catch (error) {
      logger.error('Failed to handle calculate avg crypto price event.', {
        stack: error.stack,
      });
      // FIXME: Should notify IT team.
    }
  }
}
