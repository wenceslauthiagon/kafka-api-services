import { Logger } from 'winston';
import {
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  InjectValidator,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  Validator,
  KafkaServiceParam,
  MissingEnvVarException,
} from '@zro/common';
import { KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  UserServiceKafka,
} from '@zro/pix-keys/infrastructure';
import {
  CreatePixKeyRequest,
  CreatePixKeyResponse,
  CreatePixKeyController,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';

export class CreatePixKeyRequestDto implements CreatePixKeyRequest {
  @IsUUID(4)
  id!: string;

  @IsUUID(4)
  userId!: string;

  @IsEnum(KeyType)
  type!: KeyType;

  @ValidateIf((obj: CreatePixKeyRequest) =>
    [KeyType.EMAIL, KeyType.PHONE].includes(obj.type),
  )
  @IsString()
  @MaxLength(77)
  key?: string;

  constructor(props: CreatePixKeyRequest) {
    Object.assign(this, props);
  }
}

export type CreatePixKeyResponseDto = CreatePixKeyResponse;

export type CreatePixKeyKafkaRequest = KafkaMessage<CreatePixKeyRequestDto>;

export type CreatePixKeyKafkaResponse = KafkaResponse<CreatePixKeyResponseDto>;

interface CreatePixKeyConfig {
  APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS: string;
  APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS: number;
}

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class CreatePixKeyMicroserviceController {
  private readonly naturalPersonMaxNumberOfKeys: number;
  private readonly legalPersonMaxNumberOfKeys: number;

  /**
   * Default pixKey RPC controller constructor.
   */
  constructor(
    private readonly configService: ConfigService<CreatePixKeyConfig>,
    @InjectValidator() private validate: Validator,
  ) {
    this.naturalPersonMaxNumberOfKeys = Number(
      this.configService.get<number>('APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS'),
    );

    this.legalPersonMaxNumberOfKeys = Number(
      this.configService.get<number>('APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS'),
    );

    if (
      !this.naturalPersonMaxNumberOfKeys ||
      !this.legalPersonMaxNumberOfKeys
    ) {
      throw new MissingEnvVarException([
        ...(!this.naturalPersonMaxNumberOfKeys
          ? ['APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS']
          : []),
        ...(!this.legalPersonMaxNumberOfKeys
          ? ['APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS']
          : []),
      ]);
    }
  }

  /**
   * Consumer of create pixKey code.
   *
   * @param pixKeyRepository Pix key repository.
   * @param eventEmitter Pix key event emitter.
   * @param userService User service.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CREATE)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(CreatePixKeyMicroserviceController) logger: Logger,
    @Payload('value') message: CreatePixKeyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreatePixKeyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreatePixKeyRequestDto(message);
    await this.validate(payload);

    logger.info('Create pix key from user.', { userId: payload.userId });

    // Create and call create pixKey by user and key controller.
    const controller = new CreatePixKeyController(
      logger,
      pixKeyRepository,
      userService,
      eventEmitter,
      this.naturalPersonMaxNumberOfKeys,
      this.legalPersonMaxNumberOfKeys,
    );

    // Create pixKey
    const pixKey = await controller.execute(payload);

    logger.info('Pix key created.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
