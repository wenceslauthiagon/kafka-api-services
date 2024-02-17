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
import { AdminBankingAccountRepository } from '@zro/banking/domain';
import {
  GetAllAdminBankingAccountController,
  GetAllAdminBankingAccountRequest,
  GetAllAdminBankingAccountResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  AdminBankingAccountDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAllAdminBankingAccountKafkaRequest =
  KafkaMessage<GetAllAdminBankingAccountRequest>;

export type GetAllAdminBankingAccountKafkaResponse =
  KafkaResponse<GetAllAdminBankingAccountResponse>;

/**
 * AdminBankingAccount controller.
 */
@Controller()
@MicroserviceController()
export class GetAllAdminBankingAccountMicroserviceController {
  /**
   * Consumer of get adminBankingAccounts.
   *
   * @param repository AdminBankingAccount repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_ACCOUNT.GET_ALL)
  async execute(
    @RepositoryParam(AdminBankingAccountDatabaseRepository)
    repository: AdminBankingAccountRepository,
    @LoggerParam(GetAllAdminBankingAccountMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllAdminBankingAccountRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllAdminBankingAccountKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllAdminBankingAccountRequest(message);

    // Create and call get adminBankingAccounts controller.
    const controller = new GetAllAdminBankingAccountController(
      logger,
      repository,
    );

    // Get adminBankingAccounts
    const adminBankingAccounts = await controller.execute(payload);

    logger.info('AdminBankingAccounts found.', { adminBankingAccounts });

    return {
      ctx,
      value: adminBankingAccounts,
    };
  }
}
