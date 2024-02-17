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
  GetAllOperationsByUserAndWalletAndFilterController,
  GetAllOperationsByUserAndWalletAndFilterRequest,
  GetAllOperationsByUserAndWalletAndFilterResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  UserWalletDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetAllOperationsByUserAndWalletAndFilterKafkaRequest =
  KafkaMessage<GetAllOperationsByUserAndWalletAndFilterRequest>;

export type GetAllOperationsByUserAndWalletAndFilterKafkaResponse =
  KafkaResponse<GetAllOperationsByUserAndWalletAndFilterResponse>;

/**
 * Operation controller.
 */
@Controller()
@MicroserviceController()
export class GetAllOperationsByUserAndWalletAndFilterMicroserviceController {
  /**
   * Consumer of get operations.
   *
   * @param operationRepository Operation repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.OPERATION.GET_ALL_BY_USER_AND_WALLET_AND_FILTER,
  )
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(WalletAccountCacheDatabaseRepository)
    walletAccountCacheRepository: WalletAccountCacheRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @LoggerParam(GetAllOperationsByUserAndWalletAndFilterMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllOperationsByUserAndWalletAndFilterRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllOperationsByUserAndWalletAndFilterKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllOperationsByUserAndWalletAndFilterRequest(
      message,
    );

    // Create and call get operations controller.
    const controller = new GetAllOperationsByUserAndWalletAndFilterController(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      userWalletRepository,
    );

    // Get all operations
    const operations = await controller.execute(payload);

    logger.info('Operations found.', { operations });

    return {
      ctx,
      value: operations,
    };
  }
}
