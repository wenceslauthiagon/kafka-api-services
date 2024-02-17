import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaEventPattern,
  LoggerParam,
  RepositoryParam,
  ObserverController,
} from '@zro/common';
import { TransactionRepository, PlanRepository } from '@zro/pix-zro-pay/domain';
import {
  KAFKA_EVENTS,
  PlanDatabaseRepository,
  TransactionDatabaseRepository,
} from '@zro/pix-zro-pay/infrastructure';
import {
  HandleCreateTransactionQrCodeEventController,
  HandleCreateTransactionQrCodeEventRequest,
} from '@zro/pix-zro-pay/interface';

export type HandleCreateTransactionQrCodeEventKafkaRequest =
  KafkaMessage<HandleCreateTransactionQrCodeEventRequest>;

/**
 * QrCode ready events observer.
 */
@Controller()
@ObserverController()
export class CreateTransactionQrCodeNestObserver {
  /**
   * Handler triggered when qrcodestatic is ready.
   *
   * @param message Event Kafka message.
   * @param transactionRepository Transaction repository.
   * @param planRepository Plan repository.
   * @param logger Local logger instance.
   * @returns Response Kafka message.
   */
  @KafkaEventPattern(KAFKA_EVENTS.QR_CODE.READY)
  async execute(
    @Payload('value')
    message: HandleCreateTransactionQrCodeEventRequest,
    @RepositoryParam(TransactionDatabaseRepository)
    transactionRepository: TransactionRepository,
    @RepositoryParam(PlanDatabaseRepository)
    planRepository: PlanRepository,
    @LoggerParam(CreateTransactionQrCodeNestObserver)
    logger: Logger,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new HandleCreateTransactionQrCodeEventRequest(message);

    logger.info('Handle receive ready qrCode event.', { payload });

    const controller = new HandleCreateTransactionQrCodeEventController(
      logger,
      transactionRepository,
      planRepository,
    );

    try {
      // Call the create transaction qrCode controller.
      const result = await controller.execute(payload);

      logger.info('Transaction QrCode created.', { result });
    } catch (error) {
      logger.error('Failed to create transaction QrCode.', { error });

      // FIXME: Should notify IT team.
    }
  }
}
