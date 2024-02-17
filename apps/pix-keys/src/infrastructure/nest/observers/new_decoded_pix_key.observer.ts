import { Logger } from 'winston';
import { Controller, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  Validator,
  InjectValidator,
  ObserverController,
  MissingEnvVarException,
  KafkaServiceParam,
} from '@zro/common';
import { PersonType } from '@zro/users/domain';
import { UserPixKeyDecodeLimitRepository } from '@zro/pix-keys/domain';
import { PixKeyDecodeLimitNotFoundException } from '@zro/pix-keys/application';
import {
  KAFKA_EVENTS,
  PixKeyDecodeLimitDatabaseRepository,
  UserPixKeyDecodeLimitDatabaseRepository,
  UserServiceKafka,
} from '@zro/pix-keys/infrastructure';
import {
  HandleNewDecodedPixKeyEventRequest,
  HandleNewDecodedPixKeyEventController,
} from '@zro/pix-keys/interface';

export type HandleNewDecodedPixKeyEventKafkaRequest =
  KafkaMessage<HandleNewDecodedPixKeyEventRequest>;

interface NewDecodedPixKeyConfig {
  APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT: number;
  APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT_INTERVAL: number;
  APP_DECODED_PIX_BUCKET_VALID_TRY_DECREMENT_OR_INCREMENT: number;
  APP_DECODED_PIX_BUCKET_INVALID_TRY_DECREMENT: number;
}

@Controller()
@ObserverController()
export class NewDecodedPixKeyNestObserver implements OnModuleInit {
  private readonly temporalIncrementBucket: number;
  private readonly temporalIncrementBucketInterval: number;
  private readonly validTryDecrementOrIncrementBucket: number;
  private readonly invalidTryDecrementBucket: number;
  private naturalPersonBucketLimit: number;
  private legalPersonBucketLimit: number;

  constructor(
    configService: ConfigService<NewDecodedPixKeyConfig>,
    @InjectValidator() private validate: Validator,
  ) {
    this.temporalIncrementBucket = Number(
      configService.get<number>('APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT'),
    );
    this.temporalIncrementBucketInterval = Number(
      configService.get<number>(
        'APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT_INTERVAL',
      ),
    );
    this.validTryDecrementOrIncrementBucket = Number(
      configService.get<number>(
        'APP_DECODED_PIX_BUCKET_VALID_TRY_DECREMENT_OR_INCREMENT',
      ),
    );
    this.invalidTryDecrementBucket = Number(
      configService.get<number>('APP_DECODED_PIX_BUCKET_INVALID_TRY_DECREMENT'),
    );

    if (
      !this.temporalIncrementBucket ||
      !this.temporalIncrementBucketInterval ||
      !this.validTryDecrementOrIncrementBucket ||
      !this.invalidTryDecrementBucket
    ) {
      throw new MissingEnvVarException([
        ...(!this.temporalIncrementBucket
          ? ['APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT']
          : []),
        ...(!this.temporalIncrementBucketInterval
          ? ['APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT_INTERVAL']
          : []),
        ...(!this.validTryDecrementOrIncrementBucket
          ? ['APP_DECODED_PIX_BUCKET_VALID_TRY_DECREMENT_OR_INCREMENT']
          : []),
        ...(!this.invalidTryDecrementBucket
          ? ['APP_DECODED_PIX_BUCKET_INVALID_TRY_DECREMENT']
          : []),
      ]);
    }
  }

  async onModuleInit() {
    // Load natural person type and legal person type bucket limits.
    const pixKeyDecodeLimitRepository =
      new PixKeyDecodeLimitDatabaseRepository();

    const naturalPersonPixKeyDecodeLimit =
      await pixKeyDecodeLimitRepository.getByPersonType(
        PersonType.NATURAL_PERSON,
      );

    if (!naturalPersonPixKeyDecodeLimit) {
      throw new PixKeyDecodeLimitNotFoundException({
        personType: PersonType.NATURAL_PERSON,
      });
    }

    const legalPersonPixKeyDecodeLimit =
      await pixKeyDecodeLimitRepository.getByPersonType(
        PersonType.LEGAL_PERSON,
      );

    if (!legalPersonPixKeyDecodeLimit) {
      throw new PixKeyDecodeLimitNotFoundException({
        personType: PersonType.LEGAL_PERSON,
      });
    }

    this.naturalPersonBucketLimit = naturalPersonPixKeyDecodeLimit.limit;
    this.legalPersonBucketLimit = legalPersonPixKeyDecodeLimit.limit;
  }

  /**
   * Handler triggered when new decoded pix key has been confirmed.
   *
   * @param message Event Kafka message.
   * @param decodedPixKeyRepository DecodedPixKey repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.DECODED_KEY.CONFIRMED)
  async handleConfirmedDecodedPixKey(
    @Payload('value') message: HandleNewDecodedPixKeyEventRequest,
    @RepositoryParam(UserPixKeyDecodeLimitDatabaseRepository)
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(NewDecodedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    await this.handle(
      message,
      userPixKeyDecodeLimitRepository,
      userService,
      logger,
    );
  }

  /**
   * Handler triggered when new pending decoded pix key has been created.
   *
   * @param message Event Kafka message.
   * @param decodedPixKeyRepository DecodedPixKey repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.DECODED_KEY.PENDING)
  async handlePendingDecodedPixKey(
    @Payload('value') message: HandleNewDecodedPixKeyEventRequest,
    @RepositoryParam(UserPixKeyDecodeLimitDatabaseRepository)
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(NewDecodedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    await this.handle(
      message,
      userPixKeyDecodeLimitRepository,
      userService,
      logger,
    );
  }

  /**
   * Handler triggered when new error decoded pix key has been created.
   *
   * @param message Event Kafka message.
   * @param decodedPixKeyRepository DecodedPixKey repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.DECODED_KEY.ERROR)
  async handleErrorDecodedPixKey(
    @Payload('value') message: HandleNewDecodedPixKeyEventRequest,
    @RepositoryParam(UserPixKeyDecodeLimitDatabaseRepository)
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(NewDecodedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    await this.handle(
      message,
      userPixKeyDecodeLimitRepository,
      userService,
      logger,
    );
  }

  async handle(
    message: HandleNewDecodedPixKeyEventRequest,
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    userService: UserServiceKafka,
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleNewDecodedPixKeyEventRequest(message);

    await this.validate(payload);

    logger.info('Handle new decoded pix key event.', { payload });

    const controller = new HandleNewDecodedPixKeyEventController(
      logger,
      userPixKeyDecodeLimitRepository,
      userService,
      this.naturalPersonBucketLimit,
      this.legalPersonBucketLimit,
      this.temporalIncrementBucket,
      this.temporalIncrementBucketInterval,
      this.validTryDecrementOrIncrementBucket,
      this.invalidTryDecrementBucket,
    );

    // Call the pix controller.
    await controller.execute(payload);

    logger.info('New decoded pix key has been handled.');
  }
}
