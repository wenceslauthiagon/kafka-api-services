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
  CancelPixFraudDetectionRegisteredController,
  CancelPixFraudDetectionRegisteredRequest,
  CancelPixFraudDetectionRegisteredResponse,
  PixFraudDetectionEventEmitterControllerInterface,
} from '@zro/pix-payments/interface';

export type CancelPixFraudDetectionRegisteredKafkaRequest =
  KafkaMessage<CancelPixFraudDetectionRegisteredRequest>;

export type CancelPixFraudDetectionRegisteredKafkaResponse =
  KafkaResponse<CancelPixFraudDetectionRegisteredResponse>;

/**
 * Cancel controller.
 */
@Controller()
@MicroserviceController()
export class CancelPixFraudDetectionRegisteredMicroserviceController {
  /**
   * Consumer of cancel pix fraud detection registered.
   *
   * @param fraudDetectionRepository PixFraudDetection repository.
   * @param eventEmitter PixFraudDetection event emitter.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_FRAUD_DETECTION.CANCELED_REGISTERED)
  async execute(
    @RepositoryParam(PixFraudDetectionDatabaseRepository)
    fraudDetectionRepository: PixFraudDetectionRepository,
    @EventEmitterParam(PixFraudDetectionEventKafkaEmitter)
    eventEmitter: PixFraudDetectionEventEmitterControllerInterface,
    @LoggerParam(CancelPixFraudDetectionRegisteredMicroserviceController)
    logger: Logger,
    @Payload('value') message: CancelPixFraudDetectionRegisteredRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CancelPixFraudDetectionRegisteredKafkaResponse> {
    logger.debug('Receive message.', { value: message });

    // Parse kafka message.
    const payload = new CancelPixFraudDetectionRegisteredRequest({
      issueId: message.issueId,
    });

    logger.info('Cancel pix fraud detection registered.', { payload });

    // Create and call cancel FraudDetection registered controller.
    const controller = new CancelPixFraudDetectionRegisteredController(
      logger,
      fraudDetectionRepository,
      eventEmitter,
    );

    // Create cancel pix fraud detection registered.
    const pixFraudDetection = await controller.execute(payload);

    logger.info('Cancel pix fraud detection registered created.');

    return {
      ctx,
      value: pixFraudDetection,
    };
  }
}
