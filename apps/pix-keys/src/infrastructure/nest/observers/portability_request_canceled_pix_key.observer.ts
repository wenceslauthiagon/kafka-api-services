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
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixKeyRepository,
  KeyState,
  ClaimReasonType,
  PixKeyClaimRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  PixKeyClaimDatabaseRepository,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import {
  HandlePortabilityRequestCancelOpenedFailedPixKeyEventController,
  HandlePortabilityRequestCancelOpenedPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandlePortabilityRequestCancelOpenedPixKeyEventRequest,
  HandlePortabilityRequestCancelStartedPixKeyEventController,
  HandlePortabilityRequestCancelStartedPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandlePortabilityRequestCancelOpenedPixKeyEventRequestDto
  implements HandlePortabilityRequestCancelOpenedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandlePortabilityRequestCancelOpenedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityRequestCancelOpenedPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityRequestCancelOpenedPixKeyEventRequestDto>;

export class HandlePortabilityRequestCancelStartedPixKeyEventRequestDto
  implements HandlePortabilityRequestCancelStartedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandlePortabilityRequestCancelStartedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityRequestCancelStartedPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityRequestCancelStartedPixKeyEventRequestDto>;

interface PortabilityRequestCancelPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Portability Request Cancel Opened events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class PortabilityRequestCancelPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<PortabilityRequestCancelPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.PORTABILITY_CANCEL_OPENED.TOPAZIO_GATEWAY,
      KAFKA_HUB.PORTABILITY_CANCEL_OPENED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when portability cancel process was approved by user.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_REQUEST_CANCEL_OPENED)
  async handlePortabilityRequestCancelOpenedPixKeyEvent(
    @Payload('value')
    message: HandlePortabilityRequestCancelOpenedPixKeyEventRequest,
    @LoggerParam(PortabilityRequestCancelPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received portability cancel opened event.', {
      value: message,
    });

    // Select topazio gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.PORTABILITY_CANCEL_OPENED.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when portability cancel process was approved by user.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @param pixKeyClaimRepository Pix key claim repository
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_CANCEL_OPENED.TOPAZIO_GATEWAY)
  async handlePortabilityRequestCancelOpenedPixKeyEventViaTopazio(
    @Payload('value')
    message: HandlePortabilityRequestCancelOpenedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(PortabilityRequestCancelPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandlePortabilityRequestCancelOpenedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability cancel opened event.', { payload });

    const controller =
      new HandlePortabilityRequestCancelOpenedPixKeyEventController(
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
        'Failed to cancel portability process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.PORTABILITY_CANCEL_OPENED.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_CANCEL_OPENED.DEAD_LETTER)
  async handlePortabilityRequestCancelOpenedPixKeyDeadLetterEvent(
    @Payload('value')
    message: HandlePortabilityRequestCancelOpenedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityRequestCancelPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandlePortabilityRequestCancelOpenedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability cancel process failed event.', {
      payload,
    });

    const controller =
      new HandlePortabilityRequestCancelOpenedFailedPixKeyEventController(
        pixKeyRepository,
        serviceEventEmitter,
        logger,
      );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add portability cancel process in deadLetter.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }

  /**
   * Handler triggered when claim was updated successfully to DICT.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_REQUEST_CANCEL_STARTED)
  async handlePortabilityRequestCancelStartedPixKeyEvent(
    @Payload('value')
    message: HandlePortabilityRequestCancelStartedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityRequestCancelPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandlePortabilityRequestCancelStartedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability cancel started event.', { payload });

    const controller =
      new HandlePortabilityRequestCancelStartedPixKeyEventController(
        pixKeyRepository,
        serviceEventEmitter,
        logger,
      );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to execute portability cancel started.', error);

      // FIXME: Should notify IT team.
    }
  }
}
