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
  HandlePortabilityRequestConfirmOpenedFailedPixKeyEventController,
  HandlePortabilityRequestConfirmOpenedPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandlePortabilityRequestConfirmOpenedPixKeyEventRequest,
  HandlePortabilityRequestConfirmStartedPixKeyEventController,
  HandlePortabilityRequestConfirmStartedPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandlePortabilityRequestConfirmOpenedPixKeyEventRequestDto
  implements HandlePortabilityRequestConfirmOpenedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandlePortabilityRequestConfirmOpenedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityRequestConfirmOpenedPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityRequestConfirmOpenedPixKeyEventRequestDto>;

export class HandlePortabilityRequestConfirmStartedPixKeyEventRequestDto
  implements HandlePortabilityRequestConfirmStartedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandlePortabilityRequestConfirmStartedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityRequestConfirmStartedPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityRequestConfirmStartedPixKeyEventRequestDto>;

interface PortabilityRequestConfirmPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Portability Request Confirm Opened events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class PortabilityRequestConfirmPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<PortabilityRequestConfirmPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.TOPAZIO_GATEWAY,
      KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when portability confirm process was approved by user.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_REQUEST_CONFIRM_OPENED)
  async handlePortabilityRequestConfirmOpenedPixKeyEvent(
    @Payload('value')
    message: HandlePortabilityRequestConfirmOpenedPixKeyEventKafkaRequest,
    @LoggerParam(PortabilityRequestConfirmPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received portability confirm opened event.', {
      value: message,
    });

    // Select topazio gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when portability confirm process was approved by user.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @param pixKeyClaimRepository Pix key claim repository
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.TOPAZIO_GATEWAY)
  async handlePortabilityRequestConfirmOpenedPixKeyEventViaTopazio(
    @Payload('value')
    message: HandlePortabilityRequestConfirmOpenedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(PortabilityRequestConfirmPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandlePortabilityRequestConfirmOpenedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability confirm opened event.', { payload });

    const controller =
      new HandlePortabilityRequestConfirmOpenedPixKeyEventController(
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
        'Failed to confirm portability process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_CONFIRM_OPENED.DEAD_LETTER)
  async handlePortabilityRequestConfirmOpenedPixKeyDeadLetterEvent(
    @Payload('value')
    message: HandlePortabilityRequestConfirmOpenedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityRequestConfirmPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandlePortabilityRequestConfirmOpenedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability confirm process failed event.', {
      payload,
    });

    const controller =
      new HandlePortabilityRequestConfirmOpenedFailedPixKeyEventController(
        pixKeyRepository,
        serviceEventEmitter,
        logger,
      );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add portability confirm process in deadLetter.', {
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
   * @param pixKeyClaimRepository PixKeyClaim repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_REQUEST_CONFIRM_STARTED)
  async handlePortabilityRequestConfirmStartedPixKeyEvent(
    @Payload('value')
    message: HandlePortabilityRequestConfirmStartedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityRequestConfirmPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload =
      new HandlePortabilityRequestConfirmStartedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability confirm started event.', { payload });

    const controller =
      new HandlePortabilityRequestConfirmStartedPixKeyEventController(
        pixKeyRepository,
        pixKeyClaimRepository,
        serviceEventEmitter,
        logger,
      );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to execute portability confirm started.', error);

      // FIXME: Should notify IT team.
    }
  }
}
