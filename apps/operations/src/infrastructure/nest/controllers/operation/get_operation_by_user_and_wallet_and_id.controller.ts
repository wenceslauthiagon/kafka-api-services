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
  OperationRepository,
  UserWalletRepository,
  WalletAccountCacheRepository,
} from '@zro/operations/domain';
import {
  GetOperationByUserAndWalletAndIdController,
  GetOperationByUserAndWalletAndIdRequest,
  GetOperationByUserAndWalletAndIdResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  UserWalletDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetOperationByUserAndWalletAndIdKafkaRequest =
  KafkaMessage<GetOperationByUserAndWalletAndIdRequest>;

export type GetOperationByUserAndWalletAndIdKafkaResponse =
  KafkaResponse<GetOperationByUserAndWalletAndIdResponse>;

/**
 * Operation controller.
 */
@Controller()
@MicroserviceController()
export class GetOperationByUserAndWalletAndIdMicroserviceController {
  /**
   * Consumer of get operations.
   *
   * @param operationRepository Operation repository.
   * @param walletRepository Wallet repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.GET_BY_USER_AND_WALLET_AND_ID)
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(WalletAccountCacheDatabaseRepository)
    walletAccountCacheRepository: WalletAccountCacheRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @LoggerParam(GetOperationByUserAndWalletAndIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetOperationByUserAndWalletAndIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetOperationByUserAndWalletAndIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetOperationByUserAndWalletAndIdRequest(message);

    // Create and call get operations controller.
    const controller = new GetOperationByUserAndWalletAndIdController(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
    );

    // Get all operations
    const operation = await controller.execute(payload);

    logger.info('Operation found.', { operation });

    return {
      ctx,
      value: operation,
    };
  }
}
