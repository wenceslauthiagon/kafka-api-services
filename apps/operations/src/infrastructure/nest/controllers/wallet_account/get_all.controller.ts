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
import { WalletAccountRepository } from '@zro/operations/domain';
import {
  GetAllWalletAccountController,
  GetAllWalletAccountRequest,
  GetAllWalletAccountResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetAllWalletAccountKafkaRequest =
  KafkaMessage<GetAllWalletAccountRequest>;

export type GetAllWalletAccountKafkaResponse =
  KafkaResponse<GetAllWalletAccountResponse>;

/**
 * WalletAccount controller.
 */
@Controller()
@MicroserviceController()
export class GetAllWalletAccountMicroserviceController {
  /**
   * Consumer of get WalletAccounts.
   *
   * @param walletAccountRepository WalletAccount repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_ACCOUNT.GET_ALL)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @LoggerParam(GetAllWalletAccountMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllWalletAccountRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllWalletAccountKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllWalletAccountRequest(message);

    // Create and call get WalletAccounts controller.
    const controller = new GetAllWalletAccountController(
      logger,
      walletAccountRepository,
    );

    // Get all walletAccount
    const walletAccount = await controller.execute(payload);

    logger.info('WalletAccounts found.', { walletAccount });

    return {
      ctx,
      value: walletAccount,
    };
  }
}
