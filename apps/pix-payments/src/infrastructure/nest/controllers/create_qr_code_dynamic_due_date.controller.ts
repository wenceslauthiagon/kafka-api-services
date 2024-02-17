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
  CreateQrCodeDynamicDueDateRequest,
  CreateQrCodeDynamicDueDateResponse,
  CreateQrCodeDynamicDueDateController,
  QrCodeDynamicEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateQrCodeDynamicDueDateKafkaRequest =
  KafkaMessage<CreateQrCodeDynamicDueDateRequest>;

export type CreateQrCodeDynamicDueDateKafkaResponse =
  KafkaResponse<CreateQrCodeDynamicDueDateResponse>;

/**
 * QrCodeDynamicDueDate controller.
 */
@Controller()
@MicroserviceController()
export class CreateQrCodeDynamicDueDateMicroserviceController {
  /**
   * Consumer of create qrCodeDynamicDueDate code.
   *
   * @param qrCodeDynamicRepository QrCodeDynamic repository.
   * @param eventEmitter QrCodeDynamicDueDate event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_DYNAMIC_DUE_DATE.CREATE)
  async execute(
    @RepositoryParam(QrCodeDynamicDatabaseRepository)
    qrCodeDynamicRepository: QrCodeDynamicRepository,
    @EventEmitterParam(QrCodeDynamicEventKafkaEmitter)
    eventEmitter: QrCodeDynamicEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyServiceKafka,
    @LoggerParam(CreateQrCodeDynamicDueDateMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateQrCodeDynamicDueDateRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateQrCodeDynamicDueDateKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateQrCodeDynamicDueDateRequest(message);

    logger.info('Create qrCodeDynamicDueDate from user.', { payload });

    // Create and call create qrCodeDynamicDueDate by user and key controller.
    const controller = new CreateQrCodeDynamicDueDateController(
      logger,
      qrCodeDynamicRepository,
      userService,
      pixKeyService,
      eventEmitter,
    );

    // Create qrCodeDynamicDueDate
    const qrCodeDynamicDueDate = await controller.execute(payload);

    logger.info('QrCodeDynamicDueDate created.', { qrCodeDynamicDueDate });

    return {
      ctx,
      value: qrCodeDynamicDueDate,
    };
  }
}
