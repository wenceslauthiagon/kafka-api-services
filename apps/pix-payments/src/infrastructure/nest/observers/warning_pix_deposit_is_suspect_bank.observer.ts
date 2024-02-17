import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  EventEmitterParam,
  RedisService,
  RepositoryParam,
  MissingEnvVarException,
} from '@zro/common';
import { WarningPixDepositBankBlockListRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_EVENTS,
  PixDepositEventKafkaEmitter,
  PixDepositRedisRepository,
  WarningPixDepositBankBlockListDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleWarningPixDepositIsSuspectBankEventController,
  HandleWarningPixDepositIsSuspectBankEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWarningPixDepositIsSuspectBankEventKafkaRequest =
  KafkaMessage<HandleWarningPixDepositIsSuspectBankEventRequest>;

interface WarningPixDepositIsSuspectBankConfig {
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
}

/**
 * Pix receive pending deposit events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositIsSuspectBankNestObserver {
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    readonly configService: ConfigService<WarningPixDepositIsSuspectBankConfig>,
    readonly redisService: RedisService,
  ) {
    const depositTtl = configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    if (!depositTtl) {
      throw new MissingEnvVarException([
        'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
      ]);
    }

    this.pixDepositCacheRepository = new PixDepositRedisRepository(
      redisService,
      depositTtl,
    );
  }

  /**
   * Handler triggered when deposit is processing.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_DEPOSIT.NEW)
  async execute(
    @Payload('value')
    message: HandleWarningPixDepositIsSuspectBankEventRequest,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositEventEmitter: PixDepositEventEmitterControllerInterface,
    @RepositoryParam(WarningPixDepositBankBlockListDatabaseRepository)
    warningPixBlockListRepository: WarningPixDepositBankBlockListRepository,
    @LoggerParam(WarningPixDepositIsSuspectBankNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningPixDepositIsSuspectBankEventRequest(
      message,
    );

    logger.info('Handle received deposit new event.', { payload });

    const controller = new HandleWarningPixDepositIsSuspectBankEventController(
      logger,
      this.pixDepositCacheRepository,
      warningPixBlockListRepository,
      depositEventEmitter,
    );

    try {
      // Call receive deposit handler.
      const result = await controller.execute(payload);

      logger.info('Deposit received.', { result });
    } catch (error) {
      logger.error('Failed to process deposit.', error);
    }
  }
}
