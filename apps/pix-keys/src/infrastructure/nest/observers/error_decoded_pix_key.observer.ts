import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
  MissingEnvVarException,
} from '@zro/common';
import { DecodedPixKeyRepository } from '@zro/pix-keys/domain';
import {
  DecodedPixKeyDatabaseRepository,
  KAFKA_EVENTS,
} from '@zro/pix-keys/infrastructure';
import {
  HandleErrorDecodedPixKeyEventRequest,
  HandleErrorDecodedPixKeyEventController,
} from '@zro/pix-keys/interface';

export type HandleErrorDecodedPixKeyEventKafkaRequest =
  KafkaMessage<HandleErrorDecodedPixKeyEventRequest>;

interface ErrorDecodedPixKeyConfig {
  APP_ZROBANK_ISPB: string;
}

@Controller()
@ObserverController()
export class ErrorDecodedPixKeyNestObserver {
  private readonly zroIspbCode: string;

  constructor(configService: ConfigService<ErrorDecodedPixKeyConfig>) {
    this.zroIspbCode = configService.get<string>('APP_ZROBANK_ISPB');

    if (!this.zroIspbCode) {
      throw new MissingEnvVarException('APP_ZROBANK_ISPB');
    }
  }

  /**
   * Handler triggered when Decode pix key was not found on PSP.
   *
   * @param message Event Kafka message.
   * @param decodedPixKeyRepository DecodedPixKey repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.DECODED_KEY.ERROR)
  async execute(
    @Payload('value') message: HandleErrorDecodedPixKeyEventRequest,
    @RepositoryParam(DecodedPixKeyDatabaseRepository)
    decodedPixKeyRepository: DecodedPixKeyRepository,
    @LoggerParam(ErrorDecodedPixKeyNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleErrorDecodedPixKeyEventRequest(message);

    logger.info('Handle error decoded pix key event.', { payload });

    const controller = new HandleErrorDecodedPixKeyEventController(
      logger,
      decodedPixKeyRepository,
      this.zroIspbCode,
    );

    // Call the pix controller.
    const decodedPixKey = await controller.execute(payload);

    logger.info('Decode pix key error created.', { decodedPixKey });
  }
}
