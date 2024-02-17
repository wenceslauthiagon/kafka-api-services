import { Controller } from '@nestjs/common';
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
import {
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  UpdateUserForgotPasswordController,
  UpdateUserForgotPasswordRequest,
  UpdateUserForgotPasswordResponse,
  UserForgotPasswordEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
  UserForgotPasswordDatabaseRepository,
  UserForgotPasswordEventKafkaEmitter,
} from '@zro/users/infrastructure';
import { ConfigService } from '@nestjs/config';

export type UpdateUserForgotPasswordKafkaRequest =
  KafkaMessage<UpdateUserForgotPasswordRequest>;
export type UpdateUserForgotPasswordKafkaResponse =
  KafkaResponse<UpdateUserForgotPasswordResponse>;

export interface UpdateUserForgotPasswordConfig {
  APP_USER_FORGOT_PASSWORD_MAX_ATTEMPS: number;
  APP_USER_FORGOT_PASSWORD_EXPIRATION_SECONDS: number;
}

/**
 * UserForgotPassword RPC controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserForgotPasswordMicroserviceController {
  private readonly maxAttempts: number;
  private readonly expirationSeconds: number;

  constructor(
    private readonly configService: ConfigService<UpdateUserForgotPasswordConfig>,
  ) {
    const maxAttempts = this.configService.get<number>(
      'APP_USER_FORGOT_PASSWORD_MAX_ATTEMPS',
    );
    const expirationSeconds = this.configService.get<number>(
      'APP_USER_FORGOT_PASSWORD_EXPIRATION_SECONDS',
    );

    this.maxAttempts = maxAttempts ? Number(maxAttempts) : 3;
    this.expirationSeconds = expirationSeconds
      ? Number(expirationSeconds)
      : 60 * 10;
  }

  /**
   * Consumer of create user forgot password.
   *
   * @param userRepository UserForgotPassword repository.
   * @param userForgotPasswordRepository UserForgotPassword repository.
   * @param userForgotPasswordEventEmitter UserForgotPassword event emitter.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_FORGOT_PASSWORD.UPDATE)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @RepositoryParam(UserForgotPasswordDatabaseRepository)
    userForgotPasswordRepository: UserForgotPasswordRepository,
    @EventEmitterParam(UserForgotPasswordEventKafkaEmitter)
    userForgotPasswordEventEmitter: UserForgotPasswordEventEmitterControllerInterface,
    @LoggerParam(UpdateUserForgotPasswordMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateUserForgotPasswordRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateUserForgotPasswordKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new UpdateUserForgotPasswordRequest(message);

    // Update and call update user forgot password controller.
    const controller = new UpdateUserForgotPasswordController(
      logger,
      userRepository,
      userForgotPasswordRepository,
      userForgotPasswordEventEmitter,
      this.maxAttempts,
      this.expirationSeconds,
    );

    // Update user forgot password
    const user = await controller.execute(payload);

    logger.info('UserForgotPassword updated.', { user });

    return {
      ctx,
      value: user,
    };
  }
}
