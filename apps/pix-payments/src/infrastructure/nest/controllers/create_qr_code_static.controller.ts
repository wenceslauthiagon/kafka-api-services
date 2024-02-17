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
import { QrCodeStaticRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticEventKafkaEmitter,
  UserServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeStaticRequest,
  CreateQrCodeStaticResponse,
  CreateQrCodeStaticController,
  QrCodeStaticEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CreateQrCodeStaticKafkaRequest =
  KafkaMessage<CreateQrCodeStaticRequest>;

export type CreateQrCodeStaticKafkaResponse =
  KafkaResponse<CreateQrCodeStaticResponse>;

/**
 * QrCodeStatic controller.
 */
@Controller()
@MicroserviceController()
export class CreateQrCodeStaticMicroserviceController {
  /**
   * Consumer of create qrCodeStatic code.
   *
   * @param qrCodeStaticRepository QrCodeStatic repository.
   * @param eventEmitter QrCodeStatic event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QR_CODE_STATIC.CREATE)
  async execute(
    @RepositoryParam(QrCodeStaticDatabaseRepository)
    qrCodeStaticRepository: QrCodeStaticRepository,
    @EventEmitterParam(QrCodeStaticEventKafkaEmitter)
    eventEmitter: QrCodeStaticEventEmitterControllerInterface,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyServiceKafka,
    @LoggerParam(CreateQrCodeStaticMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateQrCodeStaticRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateQrCodeStaticKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateQrCodeStaticRequest(message);

    logger.info('Create qrCodeStatic from user.', { payload });

    // Create and call create qrCodeStatic by user and key controller.
    const controller = new CreateQrCodeStaticController(
      logger,
      qrCodeStaticRepository,
      userService,
      pixKeyService,
      eventEmitter,
    );

    // Create qrCodeStatic
    const qrCodeStatic = await controller.execute(payload);

    logger.info('QrCodeStatic created.', { qrCodeStatic });

    return {
      ctx,
      value: qrCodeStatic,
    };
  }
}
