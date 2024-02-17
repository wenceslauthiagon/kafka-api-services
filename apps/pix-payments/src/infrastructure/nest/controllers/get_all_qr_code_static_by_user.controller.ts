import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import {
  GetAllQrCodeStaticByUserController,
  GetAllQrCodeStaticByUserRequest,
  GetAllQrCodeStaticByUserResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  QrCodeStaticDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetAllQrCodeStaticByUserKafkaRequest =
  KafkaMessage<GetAllQrCodeStaticByUserRequest>;

export type GetAllQrCodeStaticByUserKafkaResponse =
  KafkaResponse<GetAllQrCodeStaticByUserResponse>;

/**
 * QrCodeStatic controller.
 */
@Controller()
@MicroserviceController()
export class GetAllQrCodeStaticByUserMicroserviceController {
  /**
   * Consumer of get qrCodeStatics.
   *
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_STATIC.GET_ALL_BY_USER)
  async execute(
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @LoggerParam(GetAllQrCodeStaticByUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllQrCodeStaticByUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllQrCodeStaticByUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllQrCodeStaticByUserRequest(message);

    // Create and call get qrCodeStatics controller.
    const controller = new GetAllQrCodeStaticByUserController(
      logger,
      qrCodeStaticRepository,
    );

    // Get qrCodeStatics
    const qrCodeStatics = await controller.execute(payload);

    logger.info('QrCodeStatics by user found.', { qrCodeStatics });

    return {
      ctx,
      value: qrCodeStatics,
    };
  }
}
