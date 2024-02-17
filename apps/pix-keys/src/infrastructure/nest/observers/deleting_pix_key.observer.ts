import { Logger } from 'winston';
import { IsEnum, IsUUID } from 'class-validator';
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
  GatewayException,
  ObserverController,
  MissingEnvVarException,
} from '@zro/common';
import { JdpiPixKeyGatewayParam, JdpiPixKeyInterceptor } from '@zro/jdpi';
import { PixKeyGateway } from '@zro/pix-keys/application';
import { PixKeyRepository, KeyState } from '@zro/pix-keys/domain';
import {
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  KAFKA_EVENTS,
  KAFKA_HUB,
} from '@zro/pix-keys/infrastructure';
import {
  HandleDeletingFailedPixKeyEventController,
  HandleDeletingPixKeyEventController,
  PixKeyEventEmitterControllerInterface,
  HandleDeletingPixKeyEventRequest,
} from '@zro/pix-keys/interface';

export class HandleDeletingPixKeyEventRequestDto
  implements HandleDeletingPixKeyEventRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(KeyState)
  state: KeyState;

  @IsUUID(4)
  userId: string;

  constructor(props: HandleDeletingPixKeyEventRequest) {
    Object.assign(this, props);
  }
}

export type HandleDeletingPixKeyEventKafkaRequest =
  KafkaMessage<HandleDeletingPixKeyEventRequestDto>;

interface DeletingPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * PixKey events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class DeletingPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(
    configService: ConfigService<DeletingPixKeyConfig>,
    private kafkaService: KafkaService,
    @InjectValidator() private validate: Validator,
  ) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }

    this.kafkaService.createEvents([
      KAFKA_HUB.DELETING.TOPAZIO_GATEWAY,
      KAFKA_HUB.DELETING.DEAD_LETTER,
    ]);
  }

  /**
   * Handler triggered when key was deleted successfully to DICT.
   *
   * @param message Event Kafka message.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.KEY.DELETING)
  async handleDeletedPixKeyEvent(
    @Payload('value') message: HandleDeletingPixKeyEventRequest,
    @LoggerParam(DeletingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.info('Received delete PixKey event.', { value: message });

    // Select topazio gateway to add PixKey.
    await this.kafkaService.emit(
      KAFKA_HUB.DELETING.TOPAZIO_GATEWAY,
      ctx.getMessage(),
    );
  }

  /**
   * Handler triggered when key was deleted successfully to DICT.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PixKey psp gateway.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_HUB.DELETING.TOPAZIO_GATEWAY)
  async handleDeletedPixKeyEventViaTopazio(
    @Payload('value') message: HandleDeletingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam() pspGateway: PixKeyGateway,
    @LoggerParam(DeletingPixKeyNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleDeletingPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle deleted event by Pix ID.', { payload });

    const controller = new HandleDeletingPixKeyEventController(
      pixKeyRepository,
      serviceEventEmitter,
      pspGateway,
      logger,
      this.zroIspbCode,
    );

    try {
      // Call the pix controller.
      const pixKey = await controller.execute(payload);

      logger.info('Pix key deleted.', { pixKey });
    } catch (error) {
      logger.error(
        'Failed to delete PixKey.',
        error.data?.isAxiosError ? { error: error.data.message } : error,
      );

      if (error instanceof GatewayException) {
        // TODO: Enviar mensagem para a fila de retry
        // Isso aqui é temporário e deverá ser substituido o mais breve possível
        await this.kafkaService.emit(
          KAFKA_HUB.DELETING.DEAD_LETTER,
          ctx.getMessage(),
        );
      }
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
  @KafkaEventPattern(KAFKA_HUB.DELETING.DEAD_LETTER)
  async handleDeletedPixKeyDeadLetterEvent(
    @Payload('value') message: HandleDeletingPixKeyEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @LoggerParam(DeletingPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleDeletingPixKeyEventRequestDto(message);
    await this.validate(payload);

    logger.info('Handle deleted failed event by Pix ID.', {
      payload,
    });

    const controller = new HandleDeletingFailedPixKeyEventController(
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
