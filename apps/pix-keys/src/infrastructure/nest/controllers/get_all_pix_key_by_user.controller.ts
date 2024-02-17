import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import { isNumber } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  MissingEnvVarException,
} from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import {
  GetAllPixKeyByUserController,
  GetAllPixKeyByUserRequest,
  GetAllPixKeyByUserResponse,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';

export type GetAllPixKeyByUserKafkaRequest =
  KafkaMessage<GetAllPixKeyByUserRequest>;

export type GetAllPixKeyByUserKafkaResponse =
  KafkaResponse<GetAllPixKeyByUserResponse>;

interface GetAllPixKeyByUserConfig {
  APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS: string;
  APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS: number;
}

/**
 * PixKey controller.
 */
@Controller()
@MicroserviceController()
export class GetAllPixKeyByUserMicroserviceController {
  private readonly naturalPersonMaxNumberOfKeys: number;
  private readonly legalPersonMaxNumberOfKeys: number;

  constructor(
    private readonly configService: ConfigService<GetAllPixKeyByUserConfig>,
  ) {
    this.naturalPersonMaxNumberOfKeys = Number(
      this.configService.get<number>('APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS'),
    );

    this.legalPersonMaxNumberOfKeys = Number(
      this.configService.get<number>('APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS'),
    );

    if (
      !isNumber(this.naturalPersonMaxNumberOfKeys) ||
      !isNumber(this.legalPersonMaxNumberOfKeys)
    ) {
      throw new MissingEnvVarException([
        ...(!isNumber(this.naturalPersonMaxNumberOfKeys)
          ? ['APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS']
          : []),
        ...(!isNumber(this.legalPersonMaxNumberOfKeys)
          ? ['APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS']
          : []),
      ]);
    }
  }

  /**
   * Consumer of get all pixKeys.
   *
   * @param pixKeyRepository Pix key repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.GET_ALL_BY_USER)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @LoggerParam(GetAllPixKeyByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllPixKeyByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllPixKeyByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllPixKeyByUserRequest(message);

    // Create and call get pixKeys by user controller.
    const controller = new GetAllPixKeyByUserController(
      logger,
      pixKeyRepository,
      this.naturalPersonMaxNumberOfKeys,
      this.legalPersonMaxNumberOfKeys,
    );

    // Get pixKeys
    const pixKeys = await controller.execute(payload);

    logger.info('Pix keys found.', { pixKeys });

    return {
      ctx,
      value: pixKeys,
    };
  }
}
