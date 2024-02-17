import { Logger } from 'winston';
import { IsString } from 'class-validator';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  InjectValidator,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RepositoryParam,
  Validator,
} from '@zro/common';
import { PixKeyRepository } from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  ConfirmOwnershipClaimProcessController,
  ConfirmOwnershipClaimProcessRequest,
  ConfirmOwnershipClaimProcessResponse,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  KAFKA_TOPICS,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
} from '@zro/pix-keys/infrastructure';
import { JdpiPixKeyGatewayParam, JdpiPixKeyInterceptor } from '@zro/jdpi';

export class ConfirmOwnershipClaimProcessRequestDto
  implements ConfirmOwnershipClaimProcessRequest
{
  @IsString()
  key: string;

  constructor(props: ConfirmOwnershipClaimProcessRequest) {
    Object.assign(this, props);
  }
}

export type ConfirmOwnershipClaimProcessResponseDto =
  ConfirmOwnershipClaimProcessResponse;

export type ConfirmOwnershipClaimProcessKafkaRequest =
  KafkaMessage<ConfirmOwnershipClaimProcessRequestDto>;

export type ConfirmOwnershipClaimProcessKafkaResponse =
  KafkaResponse<ConfirmOwnershipClaimProcessResponseDto>;

interface ComfirmOwnershipClaimProcessPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * ConfirmOwnershipClaimProcess controller.
 */
@Controller()
@MicroserviceController([JdpiPixKeyInterceptor])
export class ConfirmOwnershipClaimProcessMicroserviceController {
  private readonly zroIspbCode: string;

  /**
   * Default controller constructor.
   */
  constructor(
    configService: ConfigService<ComfirmOwnershipClaimProcessPixKeyConfig>,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }
  }

  /**
   * Consumer of confirm ownership process.
   *
   * @param pixKeyRepository Pix Key repository.
   * @param message Request Kafka message.
   * @param requestId Unique shared request ID.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.KEY.CONFIRM_OWNERSHIP_PROCESS)
  async execute(
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    eventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ConfirmOwnershipClaimProcessMicroserviceController)
    logger: Logger,
    @Payload('value') message: ConfirmOwnershipClaimProcessRequest,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<ConfirmOwnershipClaimProcessKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ConfirmOwnershipClaimProcessRequestDto(message);
    await this.validate(payload);

    logger.info('Confirm ownership process.', { payload });

    // Create and call confirm ownership process controller.
    const controller = new ConfirmOwnershipClaimProcessController(
      logger,
      pixKeyRepository,
      eventEmitter,
      pspGateway,
      this.zroIspbCode,
    );

    // Create and call confirm process.
    const pixKey = await controller.execute(payload);

    logger.info('Ownership process confirmed.', { pixKey });

    return {
      ctx,
      value: pixKey,
    };
  }
}
