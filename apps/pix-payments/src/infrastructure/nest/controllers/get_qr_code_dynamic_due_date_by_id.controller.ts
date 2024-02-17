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
import { PixPaymentGateway } from '@zro/pix-payments/application';
import {
  GetQrCodeDynamicDueDateByIdController,
  GetQrCodeDynamicDueDateByIdRequest,
  GetQrCodeDynamicDueDateByIdResponse,
} from '@zro/pix-payments/interface';
import {
  KAFKA_TOPICS,
  QrCodeDynamicDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  JdpiPixPaymentGatewayParam,
  JdpiPixPaymentInterceptor,
} from '@zro/jdpi';

export type GetQrCodeDynamicDueDateByIdKafkaRequest =
  KafkaMessage<GetQrCodeDynamicDueDateByIdRequest>;

export type GetQrCodeDynamicDueDateByIdKafkaResponse =
  KafkaResponse<GetQrCodeDynamicDueDateByIdResponse>;

/**
 * QrCodeDynamic Due Date controller.
 */
@Controller()
@MicroserviceController([JdpiPixPaymentInterceptor])
export class GetQrCodeDynamicDueDateByIdMicroserviceController {
  /**
   * Consumer of get qrCodeDynamicDueDate by id.
   *
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param pspGateway Pix payment gateway repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_DYNAMIC_DUE_DATE.GET_BY_ID)
  async execute(
    @RepositoryParam(QrCodeDynamicDatabaseRepository)
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    @JdpiPixPaymentGatewayParam() pspGateway: PixPaymentGateway,
    @LoggerParam(GetQrCodeDynamicDueDateByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetQrCodeDynamicDueDateByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetQrCodeDynamicDueDateByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetQrCodeDynamicDueDateByIdRequest(message);

    logger.info('Get QrCodeDynamicDueDate from user.', {
      userId: payload.userId,
    });

    // Create and call get qrCodeDynamicDueDate by user and id controller.
    const controller = new GetQrCodeDynamicDueDateByIdController(
      logger,
      qrCodeDynamicRepository,
      pspGateway,
    );

    // Get QrCodeDynamicDueDate
    const qrCodeDynamicDueDate = await controller.execute(payload);

    logger.info('QrCodeDynamicDueDate found.', { qrCodeDynamicDueDate });

    return {
      ctx,
      value: qrCodeDynamicDueDate,
    };
  }
}
