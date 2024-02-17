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
import { AdminBankingTedRepository } from '@zro/banking/domain';
import {
  GetAllAdminBankingTedController,
  GetAllAdminBankingTedRequest,
  GetAllAdminBankingTedResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  AdminBankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAllAdminBankingTedKafkaRequest =
  KafkaMessage<GetAllAdminBankingTedRequest>;

export type GetAllAdminBankingTedKafkaResponse =
  KafkaResponse<GetAllAdminBankingTedResponse>;

/**
 * AdminBankingTed controller.
 */
@Controller()
@MicroserviceController()
export class GetAllAdminBankingTedMicroserviceController {
  /**
   * Consumer of get adminBankingTeds.
   *
   * @param repository AdminBankingTed repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_TED.GET_ALL)
  async execute(
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    repository: AdminBankingTedRepository,
    @LoggerParam(GetAllAdminBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllAdminBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllAdminBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllAdminBankingTedRequest(message);

    // Create and call get adminBankingTeds controller.
    const controller = new GetAllAdminBankingTedController(logger, repository);

    // Get adminBankingTeds
    const adminBankingTeds = await controller.execute(payload);

    logger.info('AdminBankingTeds found.', { adminBankingTeds });

    return {
      ctx,
      value: adminBankingTeds,
    };
  }
}
