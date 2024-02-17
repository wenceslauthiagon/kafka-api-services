import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  ObserverController,
  RedisService,
  MissingEnvVarException,
  KafkaServiceParam,
  RepositoryParam,
  TranslateService,
} from '@zro/common';
import { FailedNotifyCreditRepository } from '@zro/api-topazio/domain';
import { PixStatementGateway } from '@zro/api-topazio/application';
import {
  KAFKA_EVENTS,
  PixPaymentServiceKafka,
  PixStatementRedisRepository,
  PixStatementCurrentPageRedisRepository,
  FailedNotifyCreditDatabaseRepository,
} from '@zro/api-topazio/infrastructure';
import {
  HandleReprocessPixStatementEventController,
  HandleReprocessPixStatementEventRequest,
} from '@zro/api-topazio/interface';

export type HandleReprocessPixStatementEventKafkaRequest =
  KafkaMessage<HandleReprocessPixStatementEventRequest>;

export interface PixStatementConfig {
  APP_PIX_STATEMENT_DEFAULT_TTL_MS: number;
  APP_ZROBANK_ISPB: string;
}

/**
 * Pix statement events observer.
 */
@Controller()
@ObserverController()
export class ReprocessPixStatementNestObserver {
  private readonly pixStatementRedisRepository: PixStatementRedisRepository;
  private readonly pixStatementCurrentPageRedisRepository: PixStatementCurrentPageRedisRepository;
  private readonly pixStatementTTL: number;
  private readonly apiTopazioZroBankIspb: string;

  constructor(
    private readonly configService: ConfigService<PixStatementConfig>,
    private readonly redisService: RedisService,
    private readonly translateService: TranslateService,
  ) {
    //Default 30 dias em ms - 2592000000
    this.pixStatementTTL = Number(
      this.configService.get<number>(
        'APP_PIX_STATEMENT_DEFAULT_TTL_MS',
        2592000000,
      ),
    );

    this.apiTopazioZroBankIspb =
      this.configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.apiTopazioZroBankIspb) {
      throw new MissingEnvVarException(['APP_ZROBANK_ISPB']);
    }

    this.pixStatementRedisRepository = new PixStatementRedisRepository(
      this.redisService,
      this.pixStatementTTL,
    );

    this.pixStatementCurrentPageRedisRepository =
      new PixStatementCurrentPageRedisRepository(this.redisService);
  }
  /**
   * Handle Reprocess pix statement event.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.TOPAZIO.REPROCESS_PIX_STATEMENT)
  async execute(
    @Payload('value') message: HandleReprocessPixStatementEventRequest,
    @LoggerParam(ReprocessPixStatementNestObserver)
    logger: Logger,
    pspGateway: PixStatementGateway,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @RepositoryParam(FailedNotifyCreditDatabaseRepository)
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReprocessPixStatementEventRequest(message);

    logger.info('Handle reprocess pix statement event.', { payload });

    const controller = new HandleReprocessPixStatementEventController(
      logger,
      this.pixStatementRedisRepository,
      this.pixStatementCurrentPageRedisRepository,
      pspGateway,
      pixPaymentService,
      this.apiTopazioZroBankIspb,
      failedNotifyCreditRepository,
      this.translateService,
    );

    try {
      // Call the reprocess pix statement controller.
      const result = await controller.execute(payload);

      logger.info('Pix statement reprocessed.', { result });
    } catch (error) {
      logger.error('Failed to reprocess pix statement.', { error });

      // FIXME: Should notify IT team.
    }
  }
}
