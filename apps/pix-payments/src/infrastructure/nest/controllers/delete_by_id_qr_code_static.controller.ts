import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import {
  DeleteByQrCodeStaticIdController,
  DeleteByQrCodeStaticIdRequest,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';

export type DeleteByQrCodeStaticIdKafkaRequest =
  KafkaMessage<DeleteByQrCodeStaticIdRequest>;

/**
 * QrCodeStatic controller.
 */
@Controller()
@MicroserviceController()
export class DeleteByQrCodeStaticIdMicroserviceController {
  /**
   * Consumer of delete qrCodeStatic.
   *
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param eventEmitter QrCodeStatic event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_STATIC.DELETE_BY_ID)
  async execute(
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @LoggerParam(DeleteByQrCodeStaticIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteByQrCodeStaticIdRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteByQrCodeStaticIdRequest(message);

    logger.info('Delete QrCodeStatic from user.', { payload });

    // Create and call delete qrCodeStatic by user and id controller.
    const controller = new DeleteByQrCodeStaticIdController(
      logger,
      qrCodeStaticRepository,
      eventEmitter,
    );

    // Delete qrCodeStatic
    await controller.execute(payload);

    logger.info('QrCodeStatic deleted.');
  }
}
