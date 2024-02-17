import { Logger } from 'winston';
import { ConfigService } from '@nestjs/config';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  EventEmitterParam,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  MissingEnvVarException,
  KafkaService,
} from '@zro/common';
import { PixKeyClaimRepository, PixKeyRepository } from '@zro/pix-keys/domain';
import { PixKeyGateway } from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  KAFKA_EVENTS,
  PixKeyEventKafkaEmitter,
  PixKeyClaimDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import {
  HandleReceiveReadyPixKeyClaimController,
  HandleReceiveReadyPixKeyClaimEventRequest,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import { JdpiPixKeyGatewayParam, JdpiPixKeyInterceptor } from '@zro/jdpi';

export type HandleReceiveReadyPixKeyClaimRequestKafkaRequest =
  KafkaMessage<HandleReceiveReadyPixKeyClaimEventRequest>;

interface ReceiveReadyPixKeyClaimConfig {
  APP_ZROBANK_ISPB: string;
}

/**
 * Pix receive claim events observer.
 */
@Controller()
@ObserverController([JdpiPixKeyInterceptor])
export class ReceiveReadyPixKeyClaimNestObserver {
  private readonly zroIspb: string;

  constructor(
    private readonly configService: ConfigService<ReceiveReadyPixKeyClaimConfig>,
    private readonly kafkaService: KafkaService,
  ) {
    this.zroIspb = this.configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspb) {
      throw new MissingEnvVarException(['APP_ZROBANK_ISPB']);
    }

    this.kafkaService.createEvents([KAFKA_EVENTS.PIX_KEY_CLAIM.ERROR]);
  }

  /**
   * Handler triggered when a pix key claim is received.
   *
   * @param message Event Kafka message.
   * @param pixKeyRepository PixKey repository.
   * @param serviceEventEmitter Event emitter.
   * @param pspGateway PSP gateway instance.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.PIX_KEY_CLAIM.READY)
  async execute(
    @Payload('value') message: HandleReceiveReadyPixKeyClaimEventRequest,
    @RepositoryParam(PixKeyDatabaseRepository)
    pixKeyRepository: PixKeyRepository,
    @RepositoryParam(PixKeyClaimDatabaseRepository)
    pixKeyClaimRepository: PixKeyClaimRepository,
    @EventEmitterParam(PixKeyEventKafkaEmitter)
    serviceEventEmitter: PixKeyEventEmitterControllerInterface,
    @JdpiPixKeyGatewayParam()
    pspGateway: PixKeyGateway,
    @LoggerParam(ReceiveReadyPixKeyClaimNestObserver)
    logger: Logger,
    @Ctx() ctx: KafkaContext,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleReceiveReadyPixKeyClaimEventRequest(message);

    logger.info('Handle receive pix key claim event.', { payload });

    const controller = new HandleReceiveReadyPixKeyClaimController(
      logger,
      pixKeyRepository,
      pixKeyClaimRepository,
      serviceEventEmitter,
      pspGateway,
      this.zroIspb,
    );

    try {
      // Call the pix key claim controller.
      await controller.execute(payload);

      logger.info('Pix key claim received.');
    } catch (error) {
      logger.error('Failed to receive pix key claim.', error);

      // TODO: Enviar mensagem para a fila de retry
      // Isso aqui é temporário e deverá ser substituido o mais breve possível
      await this.kafkaService.emit(
        KAFKA_EVENTS.PIX_KEY_CLAIM.ERROR,
        ctx.getMessage(),
      );

      throw error;
    }
  }
}
