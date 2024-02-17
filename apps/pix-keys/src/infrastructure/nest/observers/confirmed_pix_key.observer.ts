import { Logger } from 'winston';
import { IsEnum, IsObject, IsOptional, IsUUID } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  KafkaService,
  LoggerParam,
  RepositoryParam,
  Validator,
  InjectValidator,
  ObserverController,
  TranslateService,
  FailedEntity,
  Failed,
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
  HandleConfirmedFailedPixKeyEventController,
  HandleConfirmedPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleConfirmedPixKeyEventRequest,
  HandleConfirmedFailedPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleConfirmedPixKeyEventRequestDto
  implements HandleConfirmedPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsOptional()
  @IsObject()
  failed?: Failed;

  constructor(props: HandleConfirmedPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleConfirmedPixKeyEventKafkaRequest =
  KafkaMessage<HandleConfirmedPixKeyEventRequestDto>;

interface ConfirmedPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * PixKey events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class ConfirmedPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<ConfirmedPixKeyConfig>,
    private readonly kafkaService: KafkaService,
    @InjectValidator() private readonly validate: Validator,
    private readonly translateService: TranslateService,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.CONFIRMED.TOPAZIO_GATEWAY,
      KAFKA_HUB.CONFIRMED.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when key was added successfully to DICT.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.CONFIRMED)
  async handleConfirmedPixKeyEvent(
    @Payload('value') message: HandleConfirmedPixKeyEventRequest,
    @LoggerParam(ConfirmedPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received added PixKey event.', { value: message });

    // Select topazio gateway to add PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.CONFIRMED.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when key was added successfully to DICT.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.CONFIRMED.TOPAZIO_GATEWAY)
  async handleConfirmedPixKeyEventViaTopazio(
    @Payload('value') message: HandleConfirmedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(ConfirmedPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleConfirmedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle added event by Pix ID.', { payload });

    const controller = new HandleConfirmedPixKeyEventController(
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
      const logError = error.data?.isAxiosError ? error.data.message : error;
      logger.error('Failed to add PixKey.', { error: logError });

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      const errorMessage = await this.translateService.translateException(
        'default_exceptions',
        error,
      );
      const failed = new FailedEntity({
        code: error.code,
        message: errorMessage,
      });
      const value: HandleConfirmedFailedPixKeyEventRequest = {
        ...message,
        failed,
      };
      await this.kafkaService.emit(KAFKA_HUB.CONFIRMED.DEAD_LETTER, {
        ...ctx.getMessage(),
        value,
      });
    }
  }

  /**
   * Handle PixKey dead letter event. PixKeys here failed to all retries.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.CONFIRMED.DEAD_LETTER)
  async handleConfirmedPixKeyDeadLetterEvent(
    @Payload('value') message: HandleConfirmedFailedPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(ConfirmedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleConfirmedPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle added failed event by Pix ID.', {
      payload,
    });

    const controller = new HandleConfirmedFailedPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add PixKey in deadLetter.', error);

      // FIXME: Should notify IT team.
    }
  }
}
