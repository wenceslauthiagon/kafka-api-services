import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { SignupRepository } from '@zro/signup/domain';
import {
  CreateSignupController,
  CreateSignupRequest,
  CreateSignupResponse,
} from '@zro/signup/interface';
import {
  KAFKA_TOPICS,
  SignupDatabaseRepository,
  UserServiceKafka,
} from '@zro/signup/infrastructure';

export type CreateSignupKafkaRequest = KafkaMessage<CreateSignupRequest>;
export type CreateSignupKafkaResponse = KafkaResponse<CreateSignupResponse>;

/**
 * Signup RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateSignupMicroserviceController {
  /**
   * Consumer of signup.
   *
   * @param signupRepository Signup repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SIGNUP.CREATE)
  async execute(
    @RepositoryParam(SignupDatabaseRepository)
    signupRepository: SignupRepository,
    @KafkaServiceParam(UserServiceKafka)
    userService: UserServiceKafka,
    @LoggerParam(CreateSignupMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateSignupRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateSignupKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateSignupRequest(message);

    // Create and call signup controller.
    const controller = new CreateSignupController(
      logger,
      signupRepository,
      userService,
    );

    // Create signup
    const signup = await controller.execute(payload);

    logger.info('Signup created.', { signup });

    return {
      ctx,
      value: signup,
    };
  }
}
