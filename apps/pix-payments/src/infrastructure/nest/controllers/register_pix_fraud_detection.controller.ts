import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { PixFraudDetectionRepository } from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixFraudDetectionDatabaseRepository,
  PixFraudDetectionEventKafkaEmitter,
} from '@zro/pix-payments/infrastructure';
import {
  RegisterPixFraudDetectionController,
  RegisterPixFraudDetectionRequest,
  RegisterPixFraudDetectionResponse,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type RegisterPixFraudDetectionKafkaRequest =
  KafkaMessage<RegisterPixFraudDetectionRequest>;

export type RegisterPixFraudDetectionKafkaResponse =
  KafkaResponse<RegisterPixFraudDetectionResponse>;

/**
 * Register controller.
 */
@Controller()
@MicroserviceController()
export class RegisterPixFraudDetectionMicroserviceController {
  /**
   * Consumer of register pix fraud detection.
   *
   * @param fraudDetectionRepository PixFraudDetection repository.
   * @param eventEmitter PixFraudDetection event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_FRAUD_DETECTION.REGISTERED)
  async execute(
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    fraudDetectionRepository: PixFraudDetectionRepository,
    @EventEmitterParam(PixFraudDetectionEventKafkaEmitter)
    eventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    @LoggerParam(RegisterPixFraudDetectionMicroserviceController)
    logger: Logger,
    @Payload('value') message: RegisterPixFraudDetectionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<RegisterPixFraudDetectionKafkaResponse> {
    logger.debug('Receive message.', { value: message });

    // Parse kafka message.
    const payload = new RegisterPixFraudDetectionRequest({
      id: message.id,
      issueId: message.issueId,
      document: message.document,
      fraudType: message.fraudType,
      key: message.key,
    });

    logger.info('Register pix fraud detection.', { payload });

    // Create and call register FraudDetection controller.
    const controller = new RegisterPixFraudDetectionController(
      logger,
      fraudDetectionRepository,
      eventEmitter,
    );

    // Create register pix fraud detection.
    const pixFraudDetection = await controller.execute(payload);

    logger.info('Register pix fraud detection created.');

    return {
      ctx,
      value: pixFraudDetection,
    };
  }
}
