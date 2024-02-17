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
  UpdateSignupController,
  UpdateSignupRequest,
  UpdateSignupResponse,
} from '@zro/signup/interface';
import {
  KAFKA_TOPICS,
  SignupDatabaseRepository,
} from '@zro/signup/infrastructure';

export type UpdateSignupKafkaRequest = KafkaMessage<UpdateSignupRequest>;
export type UpdateSignupKafkaResponse = KafkaResponse<UpdateSignupResponse>;

/**
 * Signup RPC controller.
 */
@Controller()
@MicroserviceController()
export class UpdateSignupMicroserviceController {
  /**
   * Consumer of signup.
   *
   * @param signupRepository Signup repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SIGNUP.UPDATE)
  async execute(
    @RepositoryParam(SignupDatabaseRepository)
    signupRepository: SignupRepository,
    @LoggerParam(UpdateSignupMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateSignupRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateSignupKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new UpdateSignupRequest(message);

    // Update and call signup controller.
    const controller = new UpdateSignupController(logger, signupRepository);

    // Update signup
    const signup = await controller.execute(payload);

    logger.info('Signup updated.', { signup });

    return {
      ctx,
      value: signup,
    };
  }
}
