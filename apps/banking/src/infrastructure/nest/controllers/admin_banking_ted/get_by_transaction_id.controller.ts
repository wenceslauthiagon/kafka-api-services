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
  GetAdminBankingTedByTransactionIdController,
  GetAdminBankingTedByTransactionIdRequest,
  GetAdminBankingTedByTransactionIdResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  AdminBankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAdminBankingTedByTransactionIdKafkaRequest =
  KafkaMessage<GetAdminBankingTedByTransactionIdRequest>;

export type GetAdminBankingTedByTransactionIdKafkaResponse =
  KafkaResponse<GetAdminBankingTedByTransactionIdResponse>;

/**
 * AdminBankingTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetAdminBankingTedByTransactionIdMicroserviceController {
  /**
   * Consumer of get adminBankingTed by transactionId.
   *
   * @param repository AdminBankingTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_TED.GET_BY_TRANSACTION_ID)
  async execute(
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    repository: AdminBankingTedRepository,
    @LoggerParam(GetAdminBankingTedByTransactionIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAdminBankingTedByTransactionIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAdminBankingTedByTransactionIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAdminBankingTedByTransactionIdRequest(message);

    logger.info('Getting adminBankingTed.', {
      transactionId: payload.transactionId,
    });

    // Create and call get adminBankingTed by transactionId controller.
    const controller = new GetAdminBankingTedByTransactionIdController(
      logger,
      repository,
    );

    // Get adminBankingTed
    const adminBankingTed = await controller.execute(payload);

    logger.info('AdminBankingTed found.', { adminBankingTed });

    return {
      ctx,
      value: adminBankingTed,
    };
  }
}
