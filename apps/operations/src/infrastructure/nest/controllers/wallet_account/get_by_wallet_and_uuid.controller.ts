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
  KAFKA_TOPICS,
  WalletAccountDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GetWalletAccountByWalletAndUuidController,
  GetWalletAccountByWalletAndUuidRequest,
  GetWalletAccountByWalletAndUuidResponse,
} from '@zro/operations/interface';

export type GetWalletAccountByWalletAndUuidKafkaRequest =
  KafkaMessage<GetWalletAccountByWalletAndUuidRequest>;

export type GetWalletAccountByWalletAndUuidKafkaResponse =
  KafkaResponse<GetWalletAccountByWalletAndUuidResponse>;

@Controller()
@MicroserviceController()
export class GetWalletAccountByWalletAndUuidMicroserviceController {
  /**
   * Parse get wallet account by wallet and uuid message and call
   * get wallet account controller.
   *
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.WALLET_ACCOUNT.GET_BY_WALLET_AND_UUID)
  async execute(
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @LoggerParam(GetWalletAccountByWalletAndUuidMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetWalletAccountByWalletAndUuidRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetWalletAccountByWalletAndUuidKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetWalletAccountByWalletAndUuidRequest(message);

    logger.info('Get wallet account by wallet and uuid.', { payload });

    // Create get controller.
    const controller = new GetWalletAccountByWalletAndUuidController(
      logger,
      walletAccountRepository,
    );

    // Get wallet account.
    const walletAccount = await controller.execute(payload);

    logger.info('Wallet account found.', { walletAccount });

    return {
      ctx,
      value: walletAccount,
    };
  }
}
