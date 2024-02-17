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
  KafkaServiceParam,
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  KAFKA_EVENTS,
  PixDepositEventKafkaEmitter,
  UserServiceKafka,
  PixDepositRedisRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleWarningPixDepositIsOverWarningIncomeEventController,
  HandleWarningPixDepositIsOverWarningIncomeEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWarningPixDepositIsOverWarningIncomeEventKafkaRequest =
  KafkaMessage<HandleWarningPixDepositIsOverWarningIncomeEventRequest>;

interface WarningPixDepositIsOverWarningIncomeConfig {
  APP_WARNING_PIX_DEPOSIT_MAX_OCCUPATION_INCOME: number;
  APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT_TO_WARNING_INCOME: number;
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
}

/**
 * Pix receive pending deposit events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositIsOverWarningIncomeNestObserver {
  private warningPixDepositMaxOccupationIncome: number;
  private warningPixDepositMinAmountToWarningIncome: number;
  private depositTtl: number;
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    private configService: ConfigService<WarningPixDepositIsOverWarningIncomeConfig>,
    private readonly redisService: RedisService,
  ) {
    this.warningPixDepositMaxOccupationIncome = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_MAX_OCCUPATION_INCOME',
    );

    this.warningPixDepositMinAmountToWarningIncome =
      this.configService.get<number>(
        'APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT_TO_WARNING_INCOME',
      );

    this.depositTtl = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    if (
      !this.warningPixDepositMaxOccupationIncome ||
      !this.warningPixDepositMinAmountToWarningIncome ||
      !this.depositTtl
    ) {
      throw new MissingEnvVarException([
        ...(!this.warningPixDepositMaxOccupationIncome
          ? ['APP_WARNING_PIX_DEPOSIT_MAX_OCCUPATION_INCOME']
          : []),
        ...(!this.warningPixDepositMinAmountToWarningIncome
          ? ['APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT_TO_WARNING_INCOME']
          : []),
        ...(!this.depositTtl
          ? ['APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL']
          : []),
      ]);
    }

    this.pixDepositCacheRepository = new PixDepositRedisRepository(
      this.redisService,
      this.depositTtl,
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
    message: HandleWarningPixDepositIsOverWarningIncomeEventRequest,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositEventEmitter: PixDepositEventEmitterControllerInterface,
    @LoggerParam(WarningPixDepositIsOverWarningIncomeNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningPixDepositIsOverWarningIncomeEventRequest(
      message,
    );

    logger.info('Handle received deposit new event.', { payload });

    const controller =
      new HandleWarningPixDepositIsOverWarningIncomeEventController(
        logger,
        this.pixDepositCacheRepository,
        userService,
        depositEventEmitter,
        this.warningPixDepositMaxOccupationIncome,
        this.warningPixDepositMinAmountToWarningIncome,
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
