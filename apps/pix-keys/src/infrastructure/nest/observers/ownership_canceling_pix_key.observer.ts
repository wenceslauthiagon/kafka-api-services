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
  HandleOwnershipCancelingFailedPixKeyEventController,
  HandleOwnershipCancelingPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleOwnershipCancelingPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleOwnershipCancelingPixKeyEventRequestDto
  implements HandleOwnershipCancelingPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  @IsEnum(ClaimReasonType)
  reason: ClaimReasonType;

  constructor(props: HandleOwnershipCancelingPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleOwnershipCancelingPixKeyEventKafkaRequest =
  KafkaMessage<HandleOwnershipCancelingPixKeyEventRequestDto>;

interface OwnershipCancelingPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Canceling ownership events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class OwnershipCancelingPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<OwnershipCancelingPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.OWNERSHIP_CANCELING.KEY_GATEWAY,
      KAFKA_HUB.OWNERSHIP_CANCELING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when canceling ownership process.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.OWNERSHIP_CANCELING)
  async handleOwnershipCancelingPixKeyEvent(
    @Payload('value') message: HandleOwnershipCancelingPixKeyEventRequest,
    @LoggerParam(OwnershipCancelingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received ownership canceling event.', { value: message });

    // Select gateway to send PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.OWNERSHIP_CANCELING.KEY_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when canceling ownership process.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.OWNERSHIP_CANCELING.KEY_GATEWAY)
  async handleOwnershipCancelingPixKeyEventViaGateway(
    @Payload('value') message: HandleOwnershipCancelingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(OwnershipCancelingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleOwnershipCancelingPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle ownership canceling event.', { payload });

    const controller = new HandleOwnershipCancelingPixKeyEventController(
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
        'Failed to ownership canceling process.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.OWNERSHIP_CANCELING.DEAD_LETTER,
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
  @KafkaEventPattern(KAFKA_HUB.OWNERSHIP_CANCELING.DEAD_LETTER)
  async handleOwnershipCancelingPixKeyDeadLetterEvent(
    @Payload('value') message: HandleOwnershipCancelingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(OwnershipCancelingPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleOwnershipCancelingPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle ownership canceling process failed event.', {
      payload,
    });

    const controller = new HandleOwnershipCancelingFailedPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      logger,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key updated.', { pixKey });
    } catch (error) {
      logger.error('Failed to add ownership canceling message in deadLetter.', {
        error,
      });

      // FIXME: Should notify IT team.
    }
  }
}
