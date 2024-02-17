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
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  KAFKA_EVENTS,
  PixDepositEventKafkaEmitter,
  PixDepositRedisRepository,
} from '@zro/pix-payments/infrastructure';
import {
  HandleWarningPixDepositIsSantanderCnpjEventController,
  HandleWarningPixDepositIsSantanderCnpjEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWarningPixDepositIsSantanderCnpjEventKafkaRequest =
  KafkaMessage<HandleWarningPixDepositIsSantanderCnpjEventRequest>;

interface WarningPixDepositIsSantanderCnpjConfig {
  APP_WARNING_PIX_DEPOSIT_SANTANDER_ISPB: string;
  APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT: number;
  APP_WARNING_PIX_DEPOSIT_SANTANDER_CNPJ: string;
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
}

/**
 * Pix receive pending deposit events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositIsSantanderCnpjNestObserver {
  private pixPaymentSantanderIspb: string;
  private warningPixDepositMinAmount: number;
  private warningPixDepositSantanderCnpj: string;
  private depositTtl: number;
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    private configService: ConfigService<WarningPixDepositIsSantanderCnpjConfig>,
    private readonly redisService: RedisService,
  ) {
    this.pixPaymentSantanderIspb = this.configService.get<string>(
      'APP_WARNING_PIX_DEPOSIT_SANTANDER_ISPB',
    );
    this.warningPixDepositMinAmount = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT',
    );
    this.warningPixDepositSantanderCnpj = this.configService.get<string>(
      'APP_WARNING_PIX_DEPOSIT_SANTANDER_CNPJ',
    );

    this.depositTtl = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    if (
      !this.pixPaymentSantanderIspb ||
      !this.warningPixDepositMinAmount ||
      !this.warningPixDepositSantanderCnpj ||
      !this.depositTtl
    ) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentSantanderIspb
          ? ['APP_WARNING_PIX_DEPOSIT_SANTANDER_ISPB']
          : []),
        ...(!this.warningPixDepositMinAmount
          ? ['APP_WARNING_PIX_DEPOSIT_MIN_AMOUNT']
          : []),
        ...(!this.warningPixDepositSantanderCnpj
          ? ['APP_WARNING_PIX_DEPOSIT_SANTANDER_CNPJ']
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
    message: HandleWarningPixDepositIsSantanderCnpjEventRequest,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositEventEmitter: PixDepositEventEmitterControllerInterface,
    @LoggerParam(WarningPixDepositIsSantanderCnpjNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningPixDepositIsSantanderCnpjEventRequest(
      message,
    );

    logger.info('Handle received deposit new event.', { payload });

    const controller =
      new HandleWarningPixDepositIsSantanderCnpjEventController(
        logger,
        this.pixDepositCacheRepository,
        depositEventEmitter,
        this.pixPaymentSantanderIspb,
        this.warningPixDepositMinAmount,
        this.warningPixDepositSantanderCnpj,
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
