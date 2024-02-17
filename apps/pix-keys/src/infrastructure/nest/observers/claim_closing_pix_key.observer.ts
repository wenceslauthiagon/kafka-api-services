import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
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
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixKeyRepository,
  KeyState,
  ClaimReasonType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyDatabaseRepository,
  PixKeyClaimDatabaseRepository,
  PixKeyEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import {
  HandleClaimClosingFailedPixKeyEventController,
  HandleClaimClosingPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleClaimClosingPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleClaimClosingPixKeyEventRequestDto
  implements HandleClaimClosingPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandleClaimClosingPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleClaimClosingPixKeyEventKafkaRequest =
  KafkaMessage<HandleClaimClosingPixKeyEventRequestDto>;

interface ClaimClosingPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Claim closing events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class ClaimClosingPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<ClaimClosingPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.CLAIM_CLOSING.TOPAZIO_GATEWAY,
      KAFKA_HUB.CLAIM_CLOSING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when claim closing process was sent by send code.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.CLAIM_CLOSING)
  async handleClaimClosingPixKeyEvent(
    @Payload('value') message: HandleClaimClosingPixKeyEventRequest,
    @LoggerParam(ClaimClosingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received claim closing event.', { value: message });

    // Select topazio gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.CLAIM_CLOSING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when claim closing process was sent by send code.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @param pixKeyClaimRepository Pix key claim repository
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.CLAIM_CLOSING.TOPAZIO_GATEWAY)
  async handleClaimClosingPixKeyEventViaTopazio(
    @Payload('value') message: HandleClaimClosingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(ClaimClosingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClaimClosingPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle claim closing event.', { payload });

    const controller = new HandleClaimClosingPixKeyEventController(
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
        'Failed to claim closing process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.CLAIM_CLOSING.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.CLAIM_CLOSING.DEAD_LETTER)
  async handleClaimClosingPixKeyDeadLetterEvent(
    @Payload('value') message: HandleClaimClosingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ClaimClosingPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleClaimClosingPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle claim closing process failed event.', {
      payload,
    });

    const controller = new HandleClaimClosingFailedPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add claim closing message in deadLetter.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }
}
