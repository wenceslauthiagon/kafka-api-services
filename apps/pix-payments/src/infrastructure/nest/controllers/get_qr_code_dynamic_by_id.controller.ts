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
import { QrCodeDynamicRepository } from '@zro/pix-payments/domain';
import {
  GetQrCodeDynamicByIdController,
  GetQrCodeDynamicByIdRequest,
  GetQrCodeDynamicByIdResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  QrCodeDynamicDatabaseRepository,
} from '@zro/pix-payments/infrastructure';

export type GetQrCodeDynamicByIdKafkaRequest =
  KafkaMessage<GetQrCodeDynamicByIdRequest>;

export type GetQrCodeDynamicByIdKafkaResponse =
  KafkaResponse<GetQrCodeDynamicByIdResponse>;

/**
 * QrCodeDynamic controller.
 */
@Controller()
@MicroserviceController()
export class GetQrCodeDynamicByIdMicroserviceController {
  /**
   * Consumer of get qrCodeDynamic by id.
   *
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_DYNAMIC.GET_BY_ID)
  async execute(
    @RepositoryParam(QrCodeDynamicDatabaseRepository)
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    @LoggerParam(GetQrCodeDynamicByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetQrCodeDynamicByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetQrCodeDynamicByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetQrCodeDynamicByIdRequest(message);

    logger.info('Get QrCodeDynamic from user.', { userId: payload.userId });

    // Create and call get qrCodeDynamic by user and id controller.
    const controller = new GetQrCodeDynamicByIdController(
      logger,
      qrCodeDynamicRepository,
    );

    // Get qrCodeDynamic
    const qrCodeDynamic = await controller.execute(payload);

    logger.info('QrCodeDynamic found.', { qrCodeDynamic });

    return {
      ctx,
      value: qrCodeDynamic,
    };
  }
}
