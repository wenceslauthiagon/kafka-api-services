import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { SignupRepository } from '@zro/signup/domain';
import {
  SignupEventEmitterControllerInterface,
  VerifyConfirmCodeSignupController,
  VerifyConfirmCodeSignupRequest,
  VerifyConfirmCodeSignupResponse,
} from '@zro/signup/interface';
import {
  KAFKA_TOPICS,
  SignupDatabaseRepository,
  SignupEventKafkaEmitter,
} from '@zro/signup/infrastructure';

export type VerifyConfirmCodeSignupKafkaRequest =
  KafkaMessage<VerifyConfirmCodeSignupRequest>;
export type VerifyConfirmCodeSignupKafkaResponse =
  KafkaResponse<VerifyConfirmCodeSignupResponse>;

interface VerifyConfirmCodeSignupConfig {
  APP_SIGNUP_MAX_NUMBER_OF_ATTEMPTS: number;
}

/**
 * Signup RPC controller.
 */
@Controller()
@MicroserviceController()
export class VerifyConfirmCodeSignupMicroserviceController {
  private maxNumberOfAttempts = 3;

  /**
   * Default constructor.
   * @param configService environment configuration.
   */
  constructor(configService: ConfigService<VerifyConfirmCodeSignupConfig>) {
    this.maxNumberOfAttempts = configService.get<number>(
      'APP_SIGNUP_MAX_NUMBER_OF_ATTEMPTS',
      3,
    );
  }

  /**
   * Consumer of signup.
   *
   * @param signupRepository Signup repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.SIGNUP.VERIFY_CONFIRM_CODE)
  async execute(
    @RepositoryParam(SignupDatabaseRepository)
    signupRepository: SignupRepository,
    @EventEmitterParam(SignupEventKafkaEmitter)
    signupEventEmitter: SignupEventEmitterControllerInterface,
    @LoggerParam(VerifyConfirmCodeSignupMicroserviceController)
    logger: Logger,
    @Payload('value') message: VerifyConfirmCodeSignupRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<VerifyConfirmCodeSignupKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new VerifyConfirmCodeSignupRequest(message);

    // VerifyConfirmCode and call signup controller.
    const controller = new VerifyConfirmCodeSignupController(
      logger,
      signupRepository,
      this.maxNumberOfAttempts,
      signupEventEmitter,
    );

    // VerifyConfirmCode signup
    const signup = await controller.execute(payload);

    logger.info('Signup verified.', { signup });

    return {
      ctx,
      value: signup,
    };
  }
}
