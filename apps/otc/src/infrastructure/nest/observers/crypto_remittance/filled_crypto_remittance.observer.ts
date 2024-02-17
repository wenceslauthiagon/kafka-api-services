import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  EventEmitterParam,
  MissingEnvVarException,
  InvalidDataFormatException,
} from '@zro/common';
import {
  SystemRepository,
  RemittanceOrderRepository,
  CryptoRemittanceRepository,
  SettlementDateCode,
  settlementDateCodes,
} from '@zro/otc/domain';
import {
  KAFKA_EVENTS,
  CryptoRemittanceDatabaseRepository,
  SystemDatabaseRepository,
  RemittanceOrderDatabaseRepository,
  RemittanceOrderEventKafkaEmitter,
} from '@zro/otc/infrastructure';
import {
  HandleFilledCryptoRemittanceEventController,
  HandleFilledCryptoRemittanceEventRequest,
  RemittanceOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';
import { ConfigService } from '@nestjs/config';

export type HandleFilledCryptoRemittanceEventKafkaRequest =
  KafkaMessage<HandleFilledCryptoRemittanceEventRequest>;

export interface FilledCryptoRemittanceConfig {
  APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE: string;
}
/**
 * Filled Crypto Remittance observer.
 */
@Controller()
@ObserverController()
export class FilledCryptoRemittanceNestObserver {
  private readonly defaultSendDateCode: SettlementDateCode;
  private readonly defaultReceiveDateCode: SettlementDateCode;

  constructor(
    private configService: ConfigService<FilledCryptoRemittanceConfig>,
  ) {
    const defaultSettlementDate = this.configService.get<string>(
      'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
    );

    if (!defaultSettlementDate) {
      throw new MissingEnvVarException([
        'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
      ]);
    }

    const dateCodes = settlementDateCodes(defaultSettlementDate);

    if (!dateCodes) {
      throw new InvalidDataFormatException([
        'APP_REMITTANCE_DEFAULT_SETTLEMENT_DATE',
      ]);
    }

    const [defaultSendDateCode, defaultReceiveDateCode] = dateCodes;
    this.defaultSendDateCode = defaultSendDateCode;
    this.defaultReceiveDateCode = defaultReceiveDateCode;
  }

  /**
   * Handler triggered when crypto remittance was filled successfully.
   *
   * @param message Event Kafka message.
   * @param cryptoRemittanceRepository Crypto Remittance repository.
   * @param remittanceOrderRepository Remittance Order repository.
   * @param systemRepository System repository.
   * @param remittanceOrderEventEmitter Remittance order event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.CRYPTO_REMITTANCE.FILLED)
  async execute(
    @Payload('value') message: HandleFilledCryptoRemittanceEventRequest,
    @RepositoryParam(CryptoRemittanceDatabaseRepository)
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    @RepositoryParam(RemittanceOrderDatabaseRepository)
    remittanceOrderRepository: RemittanceOrderRepository,
    @RepositoryParam(SystemDatabaseRepository)
    systemRepository: SystemRepository,
    @EventEmitterParam(RemittanceOrderEventKafkaEmitter)
    remittanceOrderEventEmitter: RemittanceOrderEventEmitterControllerInterface,
    @LoggerParam(FilledCryptoRemittanceNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleFilledCryptoRemittanceEventRequest({
      id: message.id,
      systemName: message.systemName,
    });

    logger.info('Handle filled crypto remittance event.', { payload });

    const controller = new HandleFilledCryptoRemittanceEventController(
      logger,
      cryptoRemittanceRepository,
      remittanceOrderRepository,
      systemRepository,
      remittanceOrderEventEmitter,
      this.defaultSendDateCode,
      this.defaultReceiveDateCode,
    );

    try {
      // Call controller.
      await controller.execute(payload);

      logger.info('Handled filled crypto remittance.');
    } catch (error) {
      logger.error('Failed to handle filled crypto remittance.', error);
    }
  }
}
