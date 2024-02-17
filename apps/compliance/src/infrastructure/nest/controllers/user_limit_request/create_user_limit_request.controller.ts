import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserLimitRequestRepository } from '@zro/compliance/domain';
import {
  CreateUserLimitRequest,
  CreateUserLimitRequestController,
  CreateUserLimitRequestResponse,
  UserLimitRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  KAFKA_TOPICS,
  UserLimitRequestDatabaseRepository,
  UserLimitRequestEventKafkaEmitter,
  UserLimitRequestServiceKafka,
} from '@zro/compliance/infrastructure';

export type CreateUserLimitRequestKafkaRequest =
  KafkaMessage<CreateUserLimitRequest>;

export type CreateUserLimitRequestKafkaResponse =
  KafkaResponse<CreateUserLimitRequestResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateUserLimitRequestMicroserviceController {
  /**
   * Consumer of create user limit request.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_LIMIT_REQUEST.CREATE)
  async execute(
    @RepositoryParam(UserLimitRequestDatabaseRepository)
    userLimitRequestRepository: UserLimitRequestRepository,
    @EventEmitterParam(UserLimitRequestEventKafkaEmitter)
    userLimitRequestEventEmitter: UserLimitRequestEventEmitterControllerInterface,
    @KafkaServiceParam(UserLimitRequestServiceKafka)
    userLimitRequestService: UserLimitRequestServiceKafka,
    @LoggerParam(CreateUserLimitRequestMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateUserLimitRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateUserLimitRequestKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateUserLimitRequest(message);

    // Create and call create user limit request controller.
    const controller = new CreateUserLimitRequestController(
      logger,
      userLimitRequestRepository,
      userLimitRequestEventEmitter,
      userLimitRequestService,
    );

    // Create user limit request
    const userLimitRequest = await controller.execute(payload);

    logger.info('User limit request created.', { userLimitRequest });

    return {
      ctx,
      value: userLimitRequest,
    };
  }
}
