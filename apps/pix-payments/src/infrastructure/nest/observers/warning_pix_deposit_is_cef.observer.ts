import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  MissingEnvVarException,
  RedisService,
  EventEmitterParam,
} from '@zro/common';
import {
  KAFKA_EVENTS,
  PixDepositRedisRepository,
  PixDepositEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  HandleWarningPixDepositIsCefEventController,
  HandleWarningPixDepositIsCefEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWarningPixDepositIsCefEventKafkaRequest =
  KafkaMessage<HandleWarningPixDepositIsCefEventRequest>;

interface WarningPixDepositIsCefConfig {
  APP_WARNING_PIX_DEPOSIT_CEF_ISPB: string;
  APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT: number;
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
}

/**
 * New pix deposit events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositIsCefNestObserver {
  private readonly pixPaymentCEFIspb: string;
  private readonly warningPixDepositMinAmount: number;
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    readonly configService: ConfigService<WarningPixDepositIsCefConfig>,
    readonly redisService: RedisService,
  ) {
    this.pixPaymentCEFIspb = configService.get<string>(
      'APP_WARNING_PIX_DEPOSIT_CEF_ISPB',
    );

    this.warningPixDepositMinAmount = configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT',
    );

    const depositTtl = configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    if (
      !this.pixPaymentCEFIspb ||
      !this.warningPixDepositMinAmount ||
      !depositTtl
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentCEFIspb
          ? ['APP_WARNING_PIX_DEPOSIT_CEF_ISPB']
          : []),
        ...(!this.warningPixDepositMinAmount
          ? ['APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT']
          : []),
        ...(!depositTtl
          ? ['APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL']
          : []),
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
    message: HandleWarningPixDepositIsCefEventRequest,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositEventEmitter: PixDepositEventEmitterControllerInterface,
    @LoggerParam(WarningPixDepositIsCefNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningPixDepositIsCefEventRequest(message);

    logger.info('Handle received deposit new event.', { payload });

    const controller = new HandleWarningPixDepositIsCefEventController(
      logger,
      this.pixDepositCacheRepository,
      depositEventEmitter,
      this.pixPaymentCEFIspb,
      this.warningPixDepositMinAmount,
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
