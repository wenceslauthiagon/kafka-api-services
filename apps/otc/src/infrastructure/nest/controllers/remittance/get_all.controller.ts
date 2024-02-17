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
import { RemittanceRepository } from '@zro/otc/domain';
import {
  GetAllRemittanceController,
  GetAllRemittanceRequest,
  GetAllRemittanceResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  RemittanceDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetAllRemittanceKafkaRequest =
  KafkaMessage<GetAllRemittanceRequest>;

export type GetAllRemittanceKafkaResponse =
  KafkaResponse<GetAllRemittanceResponse>;

/**
 * Remittance controller.
 */
@Controller()
@MicroserviceController()
export class GetAllRemittanceMicroserviceController {
  /**
   * Consumer of get Remittance.
   *
   * @param remittanceRepository Remittance repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.REMITTANCE.GET_ALL)
  async execute(
    @RepositoryParam(RemittanceDatabaseRepository)
    remittanceRepository: RemittanceRepository,
    @LoggerParam(GetAllRemittanceMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllRemittanceRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllRemittanceKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllRemittanceRequest(message);

    // Create and call get Remittances controller.
    const controller = new GetAllRemittanceController(
      logger,
      remittanceRepository,
    );

    // Get Remittance
    const remittances = await controller.execute(payload);

    logger.info('Remittances found.', { remittances });

    return {
      ctx,
      value: remittances,
    };
  }
}
