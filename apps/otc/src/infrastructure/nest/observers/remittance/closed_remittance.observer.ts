import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import {
  RemittanceOrderRepository,
  CryptoRemittanceRepository,
  RemittanceRepository,
  RemittanceOrderRemittanceRepository,
  CryptoOrderRepository,
  System,
} from '@zro/otc/domain';
import {
  KAFKA_EVENTS,
  CryptoRemittanceDatabaseRepository,
  SystemDatabaseRepository,
  RemittanceOrderDatabaseRepository,
  RemittanceDatabaseRepository,
  RemittanceOrderRemittanceDatabaseRepository,
  CryptoOrderDatabaseRepository,
  OtcBotServiceKafka,
} from '@zro/otc/infrastructure';
import {
  HandleClosedRemittanceEventController,
  HandleClosedRemittanceEventRequest,
} from '@zro/otc/interface';
import { OtcBotService, SystemNotFoundException } from '@zro/otc/application';
import { ConfigService } from '@nestjs/config';

export type HandleClosedRemittanceEventKafkaRequest =
  KafkaMessage<HandleClosedRemittanceEventRequest>;

export interface ClosedRemittanceConfig {
  APP_BOT_OTC_SYSTEM_NAME: string;
}

/**
 * Closed Remittance observer.
 */
@Controller()
@ObserverController()
export class ClosedRemittanceNestObserver {
  private botOtcSystem: System;

  constructor(private configService: ConfigService<ClosedRemittanceConfig>) {}
  async onModuleInit() {
    const systemName = this.configService.get<string>(
      'APP_BOT_OTC_SYSTEM_NAME',
    );

    if (!systemName) {
      throw new MissingEnvVarException(['APP_BOT_OTC_SYSTEM_NAME']);
    }

    const systemRepository = new SystemDatabaseRepository();

    this.botOtcSystem = await systemRepository.getByName(systemName);

    if (!this.botOtcSystem) {
      throw new SystemNotFoundException({ name: systemName });
    }
  }

  /**
   * Handler triggered when remittance was closed successfully.
   *
   * @param message Event Kafka message.
   * @param remittanceRepository Remittance repository.
   * @param remittanceOrderRepository Remittance Order repository.
   * @param remittanceOrderRemittanceRepository Remittance Order Remittance repository.
   * @param cryptoRemittanceRepository Crypto Remittance repository.
   * @param cryptoOrderRepository Crypto order event repository.
   * @param otcBotService Otc Bot service.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.REMITTANCE.CLOSED)
  async handleClosedEvent(
    @Payload('value') message: HandleClosedRemittanceEventRequest,
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @RepositoryParam(RemittanceOrderDatabaseRepository)
    remittanceOrderRepository: RemittanceOrderRepository,
    @RepositoryParam(RemittanceOrderRemittanceDatabaseRepository)
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    @RepositoryParam(CryptoRemittanceDatabaseRepository)
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @KafkaServiceParam(OtcBotServiceKafka)
    otcBotService: OtcBotService,
    @LoggerParam(ClosedRemittanceNestObserver)
    logger: Logger,
  ): Promise<void> {
    return this.handle(
      message,
      remittanceRepository,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      otcBotService,
      logger,
    );
  }

  /**
   * Handler triggered when remittance was manually closed successfully.
   *
   * @param message Event Kafka message.
   * @param remittanceRepository Remittance repository.
   * @param remittanceOrderRepository Remittance Order repository.
   * @param remittanceOrderRemittanceRepository Remittance Order Remittance repository.
   * @param cryptoRemittanceRepository Crypto Remittance repository.
   * @param cryptoOrderRepository Crypto order event repository.
   * @param otcBotService Otc Bot service.
   * @param logger Local logger instance.
   */
  @KafkaEventPattern(KAFKA_EVENTS.REMITTANCE.MANUALLY_CLOSED)
  async handleManuallyClosedEvent(
    @Payload('value') message: HandleClosedRemittanceEventRequest,
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @RepositoryParam(RemittanceOrderDatabaseRepository)
    remittanceOrderRepository: RemittanceOrderRepository,
    @RepositoryParam(RemittanceOrderRemittanceDatabaseRepository)
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    @RepositoryParam(CryptoRemittanceDatabaseRepository)
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    @RepositoryParam(CryptoOrderDatabaseRepository)
    cryptoOrderRepository: CryptoOrderRepository,
    @KafkaServiceParam(OtcBotServiceKafka)
    otcBotService: OtcBotService,
    @LoggerParam(ClosedRemittanceNestObserver)
    logger: Logger,
  ): Promise<void> {
    return this.handle(
      message,
      remittanceRepository,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      otcBotService,
      logger,
    );
  }

  private async handle(
    message: HandleClosedRemittanceEventRequest,
    remittanceRepository: RemittanceRepository,
    remittanceOrderRepository: RemittanceOrderRepository,
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    cryptoRemittanceRepository: CryptoRemittanceRepository,
    cryptoOrderRepository: CryptoOrderRepository,
    otcBotService: OtcBotService,
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClosedRemittanceEventRequest({
      id: message.id,
      systemId: message.systemId,
    });

    logger.info('Handle manually closed remittance event.', { payload });

    const controller = new HandleClosedRemittanceEventController(
      logger,
      remittanceRepository,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
      cryptoRemittanceRepository,
      cryptoOrderRepository,
      otcBotService,
    );

    try {
      // Call controller.
      await controller.execute(payload, this.botOtcSystem);

      logger.info('Handled manually closed remittance.');
    } catch (error) {
      logger.error('Failed to handle manually closed remittance.', error);
    }
  }
}
