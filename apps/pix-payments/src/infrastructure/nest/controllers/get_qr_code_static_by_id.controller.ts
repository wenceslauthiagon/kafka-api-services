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
  GetByQrCodeStaticIdController,
  GetByQrCodeStaticIdRequest,
  GetByQrCodeStaticIdResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  QrCodeStaticDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetByQrCodeStaticIdKafkaRequest =
  KafkaMessage<GetByQrCodeStaticIdRequest>;

export type GetByQrCodeStaticIdKafkaResponse =
  KafkaResponse<GetByQrCodeStaticIdResponse>;

/**
 * QrCodeStatic controller.
 */
@Controller()
@MicroserviceController()
export class GetByQrCodeStaticIdMicroserviceController {
  /**
   * Consumer of get qrCodeStatic by id.
   *
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_STATIC.GET_BY_ID)
  async execute(
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @LoggerParam(GetByQrCodeStaticIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetByQrCodeStaticIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetByQrCodeStaticIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetByQrCodeStaticIdRequest(message);

    logger.info('Get QrCodeStatic from user.', { userId: payload.userId });

    // Create and call get qrCodeStatic by user and id controller.
    const controller = new GetByQrCodeStaticIdController(
      logger,
      qrCodeStaticRepository,
    );

    // Get qrCodeStatic
    const qrCodeStatic = await controller.execute(payload);

    logger.info('QrCodeStatic found.', { qrCodeStatic });

    return {
      ctx,
      value: qrCodeStatic,
    };
  }
}
