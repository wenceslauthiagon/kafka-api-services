import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
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
  GetAdminBankingTedByIdController,
  GetAdminBankingTedByIdRequest,
  GetAdminBankingTedByIdResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  AdminBankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAdminBankingTedByIdKafkaRequest =
  KafkaMessage<GetAdminBankingTedByIdRequest>;

export type GetAdminBankingTedByIdKafkaResponse =
  KafkaResponse<GetAdminBankingTedByIdResponse>;

/**
 * AdminBankingTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetAdminBankingTedByIdMicroserviceController {
  /**
   * Consumer of get adminBankingTed by id.
   *
   * @param repository AdminBankingTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_TED.GET_BY_ID)
  async execute(
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    repository: AdminBankingTedRepository,
    @LoggerParam(GetAdminBankingTedByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAdminBankingTedByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAdminBankingTedByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAdminBankingTedByIdRequest(message);

    logger.info('Getting adminBankingTed.', { id: payload.id });

    // Create and call get adminBankingTed by id controller.
    const controller = new GetAdminBankingTedByIdController(logger, repository);

    // Get adminBankingTed
    const adminBankingTed = await controller.execute(payload);

    logger.info('AdminBankingTed found.', { adminBankingTed });

    return {
      ctx,
      value: adminBankingTed,
    };
  }
}
