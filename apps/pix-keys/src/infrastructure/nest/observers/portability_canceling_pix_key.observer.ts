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
} from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import {
  HandlePortabilityCancelingFailedPixKeyEventController,
  HandlePortabilityCancelingPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandlePortabilityCancelingPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandlePortabilityCancelingPixKeyEventRequestDto
  implements HandlePortabilityCancelingPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandlePortabilityCancelingPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityCancelingPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityCancelingPixKeyEventRequestDto>;

interface PortabilityCancelingPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Canceling portability events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class PortabilityCancelingPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<PortabilityCancelingPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.PORTABILITY_CANCELING.KEY_GATEWAY,
      KAFKA_HUB.PORTABILITY_CANCELING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when canceling portability process.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_CANCELING)
  async handlePortabilityCancelingPixKeyEvent(
    @Payload('value') message: HandlePortabilityCancelingPixKeyEventRequest,
    @LoggerParam(PortabilityCancelingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received portability canceling event.', { value: message });

    // Select gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.PORTABILITY_CANCELING.KEY_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when canceling portability process.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_CANCELING.KEY_GATEWAY)
  async handlePortabilityCancelingPixKeyEventViaGateway(
    @Payload('value') message: HandlePortabilityCancelingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(PortabilityCancelingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePortabilityCancelingPixKeyEventRequestDto(
      message,
    );
    await this.validate(payload);

    logger.info('Handle portability canceling event.', { payload });

    const controller = new HandlePortabilityCancelingPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      pspGateway,
      logger,
      this.zroIspbCode,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error(
        'Failed to portability canceling process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.PORTABILITY_CANCELING.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_CANCELING.DEAD_LETTER)
  async handlePortabilityCancelingPixKeyDeadLetterEvent(
    @Payload('value') message: HandlePortabilityCancelingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityCancelingPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePortabilityCancelingPixKeyEventRequestDto(
      message,
    );
    await this.validate(payload);

    logger.info('Handle portability canceling process failed event.', {
      payload,
    });

    const controller =
      new HandlePortabilityCancelingFailedPixKeyEventController(
        pixKeyRepository,
        serviceEventEmitter,
        logger,
      );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error(
        'Failed to add portability canceling message in deadLetter.',
        error,
      );

      // FIXME: Should notify IT team.
    }
  }
}
