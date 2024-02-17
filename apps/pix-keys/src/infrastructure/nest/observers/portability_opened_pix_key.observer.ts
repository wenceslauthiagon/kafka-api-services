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
import { PixKeyRepository, KeyState } from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import {
  HandlePortabilityOpenedFailedPixKeyEventController,
  HandlePortabilityOpenedPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandlePortabilityOpenedPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandlePortabilityOpenedPixKeyEventRequestDto
  implements HandlePortabilityOpenedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandlePortabilityOpenedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandlePortabilityOpenedPixKeyEventKafkaRequest =
  KafkaMessage<HandlePortabilityOpenedPixKeyEventRequestDto>;

interface PortabilityOpenedPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Portability Opened events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class PortabilityOpenedPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<PortabilityOpenedPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.PORTABILITY_OPENED.TOPAZIO_GATEWAY,
      KAFKA_HUB.PORTABILITY_OPENED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when portability start process was approved by user.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.PORTABILITY_OPENED)
  async handlePortabilityOpenedPixKeyEvent(
    @Payload('value') message: HandlePortabilityOpenedPixKeyEventRequest,
    @LoggerParam(PortabilityOpenedPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received portability opened event.', { value: message });

    // Select topazio gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.PORTABILITY_OPENED.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when portability start process was approved by user.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_OPENED.TOPAZIO_GATEWAY)
  async handlePortabilityOpenedPixKeyEventViaTopazio(
    @Payload('value') message: HandlePortabilityOpenedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(PortabilityOpenedPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePortabilityOpenedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability opened event.', { payload });

    const controller = new HandlePortabilityOpenedPixKeyEventController(
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
        'Failed to start portability process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.PORTABILITY_OPENED.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.PORTABILITY_OPENED.DEAD_LETTER)
  async handlePortabilityOpenedPixKeyDeadLetterEvent(
    @Payload('value') message: HandlePortabilityOpenedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(PortabilityOpenedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandlePortabilityOpenedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle portability start process failed event.', { payload });

    const controller = new HandlePortabilityOpenedFailedPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add portability start process in deadLetter.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }
}
