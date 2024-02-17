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
  WalletAccountTransactionRepository,
} from '@zro/operations/domain';
import {
  GetStatementController,
  GetStatementRequest,
  GetStatementResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  UserWalletDatabaseRepository,
  WalletAccountCacheDatabaseRepository,
  WalletAccountTransactionDatabaseRepository,
} from '@zro/operations/infrastructure';

export type GetStatementKafkaRequest = KafkaMessage<GetStatementRequest>;

export type GetStatementKafkaResponse = KafkaResponse<GetStatementResponse>;

/**
 * Operation controller.
 */
@Controller()
@MicroserviceController()
export class GetStatementMicroserviceController {
  /**
   * Consumer of get statement.
   *
   * @param operationRepository Operation repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.GET_STATEMENT)
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(WalletAccountCacheDatabaseRepository)
    walletAccountCacheRepository: WalletAccountCacheRepository,
    @RepositoryParam(WalletAccountTransactionDatabaseRepository)
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    @RepositoryParam(UserWalletDatabaseRepository)
    userWalletRepository: UserWalletRepository,
    @LoggerParam(GetStatementMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetStatementRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetStatementKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetStatementRequest(message);

    // Create and call get statement controller.
    const controller = new GetStatementController(
      logger,
      operationRepository,
      walletAccountCacheRepository,
      walletAccountTransactionRepository,
      userWalletRepository,
    );

    // Get statements
    const operations = await controller.execute(payload);

    logger.info('Statements found.', { operations });

    return {
      ctx,
      value: operations,
    };
  }
}
