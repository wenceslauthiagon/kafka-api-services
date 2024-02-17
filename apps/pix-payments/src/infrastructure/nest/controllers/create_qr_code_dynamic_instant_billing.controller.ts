import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  EventEmitterParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
  KafkaServiceParam,
} from '@zro/common';
import { QrCodeDynamicRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicEventKafkaEmitter,
  UserServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeDynamicInstantBillingRequest,
  CreateQrCodeDynamicInstantBillingResponse,
  CreateQrCodeDynamicInstantBillingController,
  QrCodeDynamicEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateQrCodeDynamicInstantBillingKafkaRequest =
  KafkaMessage<CreateQrCodeDynamicInstantBillingRequest>;

export type CreateQrCodeDynamicInstantBillingKafkaResponse =
  KafkaResponse<CreateQrCodeDynamicInstantBillingResponse>;

/**
 * QrCodeDynamic controller.
 */
@Controller()
@MicroserviceController()
export class CreateQrCodeDynamicInstantBillingMicroserviceController {
  /**
   * Consumer of create qrCodeDynamic code.
   *
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param eventEmitter QrCodeDynamic event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_DYNAMIC.CREATE)
  async execute(
    @RepositoryParam(QrCodeDynamicDatabaseRepository)
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    @EventEmitterParam(QrCodeDynamicEventKafkaEmitter)
    eventEmitter: QrCodeDynamicEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyServiceKafka,
    @LoggerParam(CreateQrCodeDynamicInstantBillingMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateQrCodeDynamicInstantBillingRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateQrCodeDynamicInstantBillingKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateQrCodeDynamicInstantBillingRequest(message);

    logger.info('Create qrCodeDynamic from user.', { payload });

    // Create and call create qrCodeDynamic by user and key controller.
    const controller = new CreateQrCodeDynamicInstantBillingController(
      logger,
      qrCodeDynamicRepository,
      userService,
      pixKeyService,
      eventEmitter,
    );

    // Create qrCodeDynamic
    const qrCodeDynamic = await controller.execute(payload);

    logger.info('QrCodeDynamic created.', { qrCodeDynamic });

    return {
      ctx,
      value: qrCodeDynamic,
    };
  }
}
