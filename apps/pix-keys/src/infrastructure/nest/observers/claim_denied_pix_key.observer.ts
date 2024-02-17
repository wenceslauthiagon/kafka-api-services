import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaService,
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  Validator,
  InjectValidator,
  GatewayException,
  ObserverController,
  MissingEnvVarException,
} from '@zro/common';
import { JdpiPixKeyGatewayParam, JdpiPixKeyInterceptor } from '@zro/jdpi';
import {
  PixKeyRepository,
  KeyState,
  ClaimReasonType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyClaimDatabaseRepository,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import {
  HandleClaimDeniedFailedPixKeyEventController,
  HandleClaimDeniedPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleClaimDeniedPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleClaimDeniedPixKeyEventRequestDto
  implements HandleClaimDeniedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandleClaimDeniedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleClaimDeniedPixKeyEventKafkaRequest =
  KafkaMessage<HandleClaimDeniedPixKeyEventRequestDto>;

interface ClaimDeniedPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Claim denied events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class ClaimDeniedPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<ClaimDeniedPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.CLAIM_DENIED.TOPAZIO_GATEWAY,
      KAFKA_HUB.CLAIM_DENIED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when claim denied process.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.CLAIM_DENIED)
  async handleClaimDeniedPixKeyEvent(
    @Payload('value') message: HandleClaimDeniedPixKeyEventRequest,
    @LoggerParam(ClaimDeniedPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received claim denied event.', { value: message });

    // Select topazio gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.CLAIM_DENIED.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when claim denied process.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @param pixKeyClaimRepository Pix key claim repository
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.CLAIM_DENIED.TOPAZIO_GATEWAY)
  async handleClaimDeniedPixKeyEventViaTopazio(
    @Payload('value') message: HandleClaimDeniedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(ClaimDeniedPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClaimDeniedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle claim denied event.', { payload });

    const controller = new HandleClaimDeniedPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      pspGateway,
      logger,
      this.zroIspbCode,
      pixKeyClaimRepository,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error(
        'Failed to claim denied process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.CLAIM_DENIED.DEAD_LETTER,
          ctx.getMessage(),
        );
      }
    }
  }

  /**
   * Handle PixKey dead letter event. PixKeys here have all retries failed.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.CLAIM_DENIED.DEAD_LETTER)
  async handleClaimDeniedPixKeyDeadLetterEvent(
    @Payload('value') message: HandleClaimDeniedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ClaimDeniedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClaimDeniedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle claim denied process failed event.', {
      payload,
    });

    const controller = new HandleClaimDeniedFailedPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add claim denied message in deadLetter.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }
}
