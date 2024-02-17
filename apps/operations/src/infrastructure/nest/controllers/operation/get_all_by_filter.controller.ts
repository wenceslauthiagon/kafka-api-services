import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  OperationRepository,
  WalletAccountRepository,
} from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  GetAllOperationsByFilterController,
  GetAllOperationsByFilterRequest,
  GetAllOperationsByFilterResponse,
} from '@zro/operations/interface';
import {
  KAFKA_TOPICS,
  OperationDatabaseRepository,
  WalletAccountDatabaseRepository,
  UserServiceKafka,
} from '@zro/operations/infrastructure';

export type GetAllOperationsByFilterKafkaRequest =
  KafkaMessage<GetAllOperationsByFilterRequest>;

export type GetAllOperationsByFilterKafkaResponse =
  KafkaResponse<GetAllOperationsByFilterResponse>;

/**
 * Operation controller.
 */
@Controller()
@MicroserviceController()
export class GetAllOperationsByFilterMicroserviceController {
  /**
   * Consumer of get operations.
   *
   * @param operationRepository Operation repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.OPERATION.GET_ALL_BY_FILTER)
  async execute(
    @RepositoryParam(OperationDatabaseRepository)
    operationRepository: OperationRepository,
    @RepositoryParam(WalletAccountDatabaseRepository)
    walletAccountRepository: WalletAccountRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserService,
    @LoggerParam(GetAllOperationsByFilterMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllOperationsByFilterRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllOperationsByFilterKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllOperationsByFilterRequest(message);

    // Create and call get operations controller.
    const controller = new GetAllOperationsByFilterController(
      logger,
      operationRepository,
      walletAccountRepository,
      userService,
    );

    // Get all operations
    const operations = await controller.execute(payload);

    logger.debug('Operations found.', { operations });

    return {
      ctx,
      value: operations,
    };
  }
}
