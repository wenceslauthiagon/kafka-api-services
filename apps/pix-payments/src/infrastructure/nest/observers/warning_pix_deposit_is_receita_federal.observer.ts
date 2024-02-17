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
  HandleWarningPixDepositIsReceitaFederalEventController,
  HandleWarningPixDepositIsReceitaFederalEventRequest,
  PixDepositEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type HandleWarningPixDepositIsReceitaFederalEventKafkaRequest =
  KafkaMessage<HandleWarningPixDepositIsReceitaFederalEventRequest>;

interface WarningPixDepositIsReceitaFederalConfig {
  APP_WARNING_PIX_DEPOSIT_RECEITA_FEDERAL_CNPJ: string;
  APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL: number;
}

/**
 * Pix receive pending deposit events observer.
 */
@Controller()
@ObserverController()
export class WarningPixDepositIsReceitaFederalNestObserver {
  private pixPaymentReceitaFederalCnpj: string;
  private depositTtl: number;
  private readonly pixDepositCacheRepository: PixDepositRedisRepository;

  constructor(
    private configService: ConfigService<WarningPixDepositIsReceitaFederalConfig>,
    private readonly redisService: RedisService,
  ) {
    this.pixPaymentReceitaFederalCnpj = this.configService.get<string>(
      'APP_WARNING_PIX_DEPOSIT_RECEITA_FEDERAL_CNPJ',
    );

    this.depositTtl = this.configService.get<number>(
      'APP_WARNING_PIX_DEPOSIT_RECEIVED_DEPOSIT_TTL',
    );

    if (!this.pixPaymentReceitaFederalCnpj || !this.depositTtl) {
      throw new MissingEnvVarException([
        ...(!this.pixPaymentReceitaFederalCnpj
          ? ['APP_WARNING_PIX_DEPOSIT_RECEITA_FEDERAL_CNPJ']
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
    message: HandleWarningPixDepositIsReceitaFederalEventRequest,
    @EventEmitterParam(PixDepositEventKafkaEmitter)
    depositEventEmitter: PixDepositEventEmitterControllerInterface,
    @LoggerParam(WarningPixDepositIsReceitaFederalNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleWarningPixDepositIsReceitaFederalEventRequest(
      message,
    );

    logger.info('Handle received deposit new event.', { payload });

    const controller =
      new HandleWarningPixDepositIsReceitaFederalEventController(
        logger,
        this.pixDepositCacheRepository,
        depositEventEmitter,
        this.pixPaymentReceitaFederalCnpj,
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
