import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  KafkaServiceParam,
  ObserverController,
  MissingEnvVarException,
  EventEmitterParam,
  RedisService,
} from '@zro/common';
import {
  HandleNotifyCreditValidationEventController,
  HandleNotifyCreditValidationJdpiEventRequest,
  NotifyCreditValidationEventEmitterControllerInterface,
} from '@zro/api-jdpi/interface';
import {
  KAFKA_EVENTS,
  NotifyCreditValidationEventKafkaEmitter,
  NotifyCreditValidationRedisRepository,
  PixPaymentServiceKafka,
  QrCodeStaticRedisRepository,
  UserServiceKafka,
} from '@zro/api-jdpi/infrastructure';

export type HandleNotifyCreditValidationJdpiEventKafkaRequest =
  KafkaMessage<HandleNotifyCreditValidationJdpiEventRequest>;

interface NotifyCreditValidationConfig {
  APP_ZROBANK_ISPB: string;
  APP_NOTIFY_CREDIT_VALIDATION_CACHE_TTL_SEC: number;
}

@Controller()
@ObserverController()
export class NotifyCreditValidationNestObserver {
  private readonly zroIspbCode: string;
  private readonly notifyCreditValidationCacheRepository: NotifyCreditValidationRedisRepository;
  private readonly qrCodeStaticCacheRepository: QrCodeStaticRedisRepository;

  constructor(
    configService: ConfigService<NotifyCreditValidationConfig>,
    redisService: RedisService,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException(['APP_ZROBANK_ISPB']);
    }

    const notifyCreditValidationCacheTTL =
      Number(
        configService.get<number>(
          'APP_NOTIFY_CREDIT_VALIDATION_CACHE_TTL_SEC',
        ) || 600,
      ) * 1000;

    this.notifyCreditValidationCacheRepository =
      new NotifyCreditValidationRedisRepository(
        redisService,
        notifyCreditValidationCacheTTL,
      );
    this.qrCodeStaticCacheRepository = new QrCodeStaticRedisRepository(
      redisService,
    );
  }

  /**
   * Handler triggered when notify credit validation created.
   *
   * @param message Event Kafka message.
   * @param operationService Operation service kafka
   * @param userService User service kafka
   * @param pixPaymentService Pix payment service kafka
   * @param serviceEventEmitter Event emmitter notify credit validation event
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.JDPI.NOTIFY_CREDIT_VALIDATION)
  async execute(
    @Payload('value')
    message: HandleNotifyCreditValidationJdpiEventRequest,
    @EventEmitterParam(NotifyCreditValidationEventKafkaEmitter)
    serviceEventEmitter: NotifyCreditValidationEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(PixPaymentServiceKafka)
    pixPaymentService: PixPaymentServiceKafka,
    @LoggerParam(NotifyCreditValidationNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNotifyCreditValidationJdpiEventRequest(message);

    logger.info('Handle added event notify credit validation.', {
      payload,
    });

    const controller = new HandleNotifyCreditValidationEventController(
      logger,
      this.notifyCreditValidationCacheRepository,
      this.qrCodeStaticCacheRepository,
      serviceEventEmitter,
      userService,
      pixPaymentService,
      this.zroIspbCode,
    );

    try {
      // Call the notify credit validation controller.
      await controller.execute(payload);

      logger.info('Notify credit validation created.');
    } catch (error) {
      logger.error('Failed to create notify credit validation.', error);

      // FIXME: Should notify IT team.
    }
  }
}
