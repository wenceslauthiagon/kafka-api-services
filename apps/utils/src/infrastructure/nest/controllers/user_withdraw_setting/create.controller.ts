import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
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
import { UserWithdrawSettingRepository } from '@zro/utils/domain';
import {
  CreateUserWithdrawSettingRequest,
  CreateUserWithdrawSettingController,
  CreateUserWithdrawSettingResponse,
  UserWithdrawSettingEventEmitterControllerInterface,
} from '@zro/utils/interface';
import {
  KAFKA_TOPICS,
  UserWithdrawSettingDatabaseRepository,
  UserWithdrawSettingEventKafkaEmitter,
} from '@zro/utils/infrastructure';

export type CreateUserWithdrawSettingKafkaRequest =
  KafkaMessage<CreateUserWithdrawSettingRequest>;

export type CreateUserWithdrawSettingKafkaResponse =
  KafkaResponse<CreateUserWithdrawSettingResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateUserWithdrawSettingMicroserviceController {
  /**
   * Consumer of create user withdraw setting request.
   *
   * @param userRepository User repository.
   * @param message  Kafka message.
   * @param logger  logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WITHDRAW_SETTING.CREATE)
  async execute(
    @RepositoryParam(UserWithdrawSettingDatabaseRepository)
    userWithdrawSettingRepository: UserWithdrawSettingRepository,
    @EventEmitterParam(UserWithdrawSettingEventKafkaEmitter)
    userWithdrawSettingEventEmitter: UserWithdrawSettingEventEmitterControllerInterface,
    @LoggerParam(CreateUserWithdrawSettingMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateUserWithdrawSettingRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateUserWithdrawSettingKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateUserWithdrawSettingRequest(message);

    // Create and call create user withdraw setting controller.
    const controller = new CreateUserWithdrawSettingController(
      logger,
      userWithdrawSettingRepository,
      userWithdrawSettingEventEmitter,
    );

    // Create user withdraw setting
    const userWithdrawSetting = await controller.execute(payload);

    logger.info('User withdraw setting created.', { userWithdrawSetting });

    return {
      ctx,
      value: userWithdrawSetting,
    };
  }
}
