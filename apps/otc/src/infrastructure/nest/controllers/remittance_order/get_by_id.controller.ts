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
  KAFKA_TOPICS,
  RemittanceOrderDatabaseRepository,
  RemittanceOrderRemittanceDatabaseRepository,
} from '@zro/otc/infrastructure';
import {
  GetRemittanceOrderByIdController,
  GetRemittanceOrderByIdRequest,
  GetRemittanceOrderByIdResponse,
} from '@zro/otc/interface';
import {
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
} from '@zro/otc/domain';

export type GetRemittanceOrderByIdKafkaRequest =
  KafkaMessage<GetRemittanceOrderByIdRequest>;

export type GetRemittanceOrderByIdKafkaResponse =
  KafkaResponse<GetRemittanceOrderByIdResponse>;

/**
 * Remittance Order controller.
 */
@Controller()
@MicroserviceController()
export class GetRemittanceOrderByIdMicroserviceController {
  /**
   * Consumer of get remittance order.
   *
   * @param remittanceOrderRepository Remittance Order repository.
   * @param remittanceOrderRemittanceRepository Remittance Order Remittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE_ORDER.GET_BY_ID)
  async execute(
    @RepositoryParam(RemittanceOrderDatabaseRepository)
    remittanceOrderRepository: RemittanceOrderRepository,
    @RepositoryParam(RemittanceOrderRemittanceDatabaseRepository)
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    @LoggerParam(GetRemittanceOrderByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetRemittanceOrderByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetRemittanceOrderByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetRemittanceOrderByIdRequest(message);

    // Create and call get remittance order controller.
    const controller = new GetRemittanceOrderByIdController(
      logger,
      remittanceOrderRepository,
      remittanceOrderRemittanceRepository,
    );

    // Get remittance order
    const remittanceOrder = await controller.execute(payload);

    logger.debug('Remittance Order found.', {
      remittanceOrder,
    });

    return {
      ctx,
      value: remittanceOrder,
    };
  }
}
