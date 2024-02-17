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
  GetAllRemittanceOrdersByFilterController,
  GetAllRemittanceOrdersByFilterRequest,
  GetAllRemittanceOrdersByFilterResponse,
} from '@zro/otc/interface';
import {
  RemittanceOrderRemittanceRepository,
  RemittanceOrderRepository,
} from '@zro/otc/domain';

export type GetAllRemittanceOrdersByFilterKafkaRequest =
  KafkaMessage<GetAllRemittanceOrdersByFilterRequest>;

export type GetAllRemittanceOrdersByFilterKafkaResponse =
  KafkaResponse<GetAllRemittanceOrdersByFilterResponse>;

/**
 * Remittance Order controller.
 */
@Controller()
@MicroserviceController()
export class GetAllRemittanceOrdersByFilterMicroserviceController {
  /**
   * Consumer of get remittance orders.
   *
   * @param remittanceOrderRemittanceRepository Remittance Order repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE_ORDER.GET_ALL_BY_FILTER)
  async execute(
    @RepositoryParam(RemittanceOrderRemittanceDatabaseRepository)
    remittanceOrderRemittanceRepository: RemittanceOrderRemittanceRepository,
    @RepositoryParam(RemittanceOrderDatabaseRepository)
    remittanceOrderRepository: RemittanceOrderRepository,
    @LoggerParam(GetAllRemittanceOrdersByFilterMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllRemittanceOrdersByFilterRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllRemittanceOrdersByFilterKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllRemittanceOrdersByFilterRequest(message);

    // Create and call get remittance orders controller.
    const controller = new GetAllRemittanceOrdersByFilterController(
      logger,
      remittanceOrderRemittanceRepository,
      remittanceOrderRepository,
    );

    // Get all remittance orders
    const remittanceOrders = await controller.execute(payload);

    logger.debug('Remittance Orders found.', {
      remittanceOrders: remittanceOrders,
    });

    return {
      ctx,
      value: remittanceOrders,
    };
  }
}
