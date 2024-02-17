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
import {
  PaymentRepository,
  PixDevolutionReceivedRepository,
} from '@zro/pix-payments/domain';
import {
  KAFKA_TOPICS,
  PixDevolutionReceivedDatabaseRepository,
  PaymentDatabaseRepository,
} from '@zro/pix-payments/infrastructure';
import {
  GetPixDevolutionReceivedByOperationIdController,
  GetPixDevolutionReceivedByOperationIdRequest,
  GetPixDevolutionReceivedByOperationIdResponse,
} from '@zro/pix-payments/interface';

export type GetPixDevolutionReceivedByOperationIdKafkaRequest =
  KafkaMessage<GetPixDevolutionReceivedByOperationIdRequest>;

export type GetPixDevolutionReceivedByOperationIdKafkaResponse =
  KafkaResponse<GetPixDevolutionReceivedByOperationIdResponse>;

/**
 * Get devolutionReceived by operation id controller.
 */
@Controller()
@MicroserviceController()
export class GetPixDevolutionReceivedByOperationIdMicroserviceController {
  /**
   * Consumer of GetPixDevolutionReceivedByOperationId.
   *
   * @param devolutionReceivedRepository DevolutionReceived repository.
   * @param paymentRepository Payment repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.PIX_DEVOLUTION_RECEIVED.GET_BY_OPERATION_ID)
  async execute(
    @RepositoryParam(PixDevolutionReceivedDatabaseRepository)
    devolutionReceivedRepository: PixDevolutionReceivedRepository,
    @RepositoryParam(PaymentDatabaseRepository)
    paymentRepository: PaymentRepository,
    @LoggerParam(GetPixDevolutionReceivedByOperationIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetPixDevolutionReceivedByOperationIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetPixDevolutionReceivedByOperationIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetPixDevolutionReceivedByOperationIdRequest(message);

    logger.info('Get devolutionReceived by operation id from user.', {
      userId: payload.userId,
    });

    // Get GetPixDevolutionReceivedByOperationId controller.
    const controller = new GetPixDevolutionReceivedByOperationIdController(
      logger,
      devolutionReceivedRepository,
      paymentRepository,
    );

    const devolutionReceived = await controller.execute(payload);

    logger.info('PixDevolutionReceived response.', { devolutionReceived });

    return {
      ctx,
      value: devolutionReceived,
    };
  }
}
