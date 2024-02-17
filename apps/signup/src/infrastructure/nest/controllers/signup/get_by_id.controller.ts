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
import { SignupRepository } from '@zro/signup/domain';
import {
  GetSignupByIdController,
  GetSignupByIdRequest,
  GetSignupByIdResponse,
} from '@zro/signup/interface';
import {
  KAFKA_TOPICS,
  SignupDatabaseRepository,
} from '@zro/signup/infrastructure';

export type GetSignupByIdKafkaRequest = KafkaMessage<GetSignupByIdRequest>;
export type GetSignupByIdKafkaResponse = KafkaResponse<GetSignupByIdResponse>;

/**
 * Signup RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetSignupByIdMicroserviceController {
  /**
   * Consumer of signup.
   *
   * @param signupRepository Signup repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SIGNUP.GET_BY_ID)
  async execute(
    @RepositoryParam(SignupDatabaseRepository)
    signupRepository: SignupRepository,
    @LoggerParam(GetSignupByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetSignupByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetSignupByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new GetSignupByIdRequest(message);

    // Create and call signup controller.
    const controller = new GetSignupByIdController(logger, signupRepository);

    // Get signup
    const signup = await controller.execute(payload);

    logger.info('Got Signup by Id.', { signup });

    return {
      ctx,
      value: signup,
    };
  }
}
