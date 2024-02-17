import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { JdpiPixKeyGatewayParam, JdpiPixKeyInterceptor } from '@zro/jdpi';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaService,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
  RedisService,
  MissingEnvVarException,
} from '@zro/common';
import {
  DecodedPixKeyRepository,
  DecodedPixKeyState,
  PixKeyRepository,
  UserPixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import {
  DecodedPixKeyNotFoundException,
  DecodedPixKeyPspGateway,
  PixKeyDecodeLimitNotFoundException,
} from '@zro/pix-keys/application';
import {
  KAFKA_TOPICS,
  KAFKA_EVENTS,
  PixKeyDatabaseRepository,
  DecodedPixKeyEventKafkaEmitter,
  UserServiceKafka,
  DecodedPixKeyDatabaseRepository,
  PixKeyDecodeLimitDatabaseRepository,
  UserPixKeyDecodeLimitDatabaseRepository,
  DecodedPixKeyRedisRepository,
} from '@zro/pix-keys/infrastructure';
import {
  CreateDecodedPixKeyRequest,
  CreateDecodedPixKeyResponse,
  CreateDecodedPixKeyController,
  DecodedPixKeyEventEmitterControllerInterface,
  HandleErrorDecodedPixKeyEventRequest,
} from '@zro/pix-keys/interface';
import { PersonType } from '@zro/users/domain';

export type CreateDecodedPixKeyKafkaRequest =
  KafkaMessage<CreateDecodedPixKeyRequest>;

export type CreateDecodedPixKeyKafkaResponse =
  KafkaResponse<CreateDecodedPixKeyResponse>;

interface CreateDecodedPixKeyConfig {
  APP_ZROBANK_ISPB: string;
  APP_PIX_DECODED_KEY_CACHE_TTL_MS: number;
  APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT: number;
  APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT_INTERVAL: number;
}

/**
 * DecodedPixKey controller.
 */
@Controller()
@MicroserviceController([JdpiPixKeyInterceptor])
export class CreateDecodedPixKeyMicroserviceController {
  private readonly zroIspbCode: string;
  private readonly decodedPixKeyRedisRepository: DecodedPixKeyRedisRepository;
  private readonly temporalIncrementBucket: number;
  private readonly temporalIncrementBucketInterval: number;
  private naturalPersonBucketLimit: number;
  private legalPersonBucketLimit: number;

  /**
   * Default decodedPixKey RPC controller constructor.
   */
  constructor(
    private readonly configService: ConfigService<CreateDecodedPixKeyConfig>,
    private readonly redisService: RedisService,
    private readonly kafkaService: KafkaService,
  ) {
    this.zroIspbCode = this.configService.get<string>('APP_ZROBANK_ISPB');
    const decodedPixKeyTTL = this.configService.get<number>(
      'APP_PIX_DECODED_KEY_CACHE_TTL_MS',
      86400000, // 24hs; value in miliseconds
    );
    this.temporalIncrementBucket = configService.get<number>(
      'APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT',
    );
    this.temporalIncrementBucketInterval = configService.get<number>(
      'APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT_INTERVAL',
    );

    if (
      !this.zroIspbCode ||
      !this.temporalIncrementBucket ||
      !this.temporalIncrementBucketInterval
    ) {
      throw new MissingEnvVarException([
        ...(!this.zroIspbCode ? ['APP_ZROBANK_ISPB'] : []),
        ...(!this.temporalIncrementBucket
          ? ['APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT']
          : []),
        ...(!this.temporalIncrementBucketInterval
          ? ['APP_DECODED_PIX_BUCKET_TEMPORAL_INCREMENT_INTERVAL']
          : []),
      ]);
    }

    this.decodedPixKeyRedisRepository = new DecodedPixKeyRedisRepository(
      this.redisService,
      decodedPixKeyTTL,
    );
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
   * Consumer of decode pix key.
   *
   * @param jdpiPixKeyGateway DecodedPixKey gateway.
   * @param decodedPixKeyRepository DecodedPixKey repository.
   * @param pixKeyRepository PixKey repository.
   * @param decodedPixKeyEventEmitter DecodedPixKey event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @param userService User service.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.DECODED_KEY.CREATE)
  async execute(
    @JdpiPixKeyGatewayParam() jdpiPixKeyGateway: DecodedPixKeyPspGateway,
    @RepositoryParam(DecodedPixKeyDatabaseRepository)
    decodedPixKeyRepository: DecodedPixKeyRepository,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(UserPixKeyDecodeLimitDatabaseRepository)
    userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository,
    @EventEmitterParam(DecodedPixKeyEventKafkaEmitter)
    decodedPixKeyEventEmitter: DecodedPixKeyEventEmitterControllerInterface,
    @LoggerParam(CreateDecodedPixKeyMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateDecodedPixKeyRequest,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateDecodedPixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateDecodedPixKeyRequest(message);

    logger.info('Decode pix key from user.', { payload });

    // Create and call decode pix key by user and key controller.
    const controller = new CreateDecodedPixKeyController(
      logger,
      decodedPixKeyRepository,
      pixKeyRepository,
      this.decodedPixKeyRedisRepository,
      decodedPixKeyEventEmitter,
      userService,
      jdpiPixKeyGateway,
      userPixKeyDecodeLimitRepository,
      this.zroIspbCode,
      this.naturalPersonBucketLimit,
      this.legalPersonBucketLimit,
      this.temporalIncrementBucketInterval,
      this.temporalIncrementBucket,
    );

    try {
      // Decode pix key
      const decodedPixKey = await controller.execute(payload);

      logger.info('Pix key decoded.', { decodedPixKey });

      return {
        ctx,
        value: decodedPixKey,
      };
    } catch (error) {
      logger.error('Failed to pix key decoded.', { error });

      if (error instanceof DecodedPixKeyNotFoundException) {
        const value: HandleErrorDecodedPixKeyEventRequest = {
          ...message,
          state: DecodedPixKeyState.ERROR,
        };

        await this.kafkaService.emit(KAFKA_EVENTS.DECODED_KEY.ERROR, {
          ...ctx.getMessage(),
          value,
        });
      }

      throw error;
    }
  }
}
