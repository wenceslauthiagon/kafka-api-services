import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  AddUserPinController,
  AddUserPinRequest,
  AddUserPinResponse,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  UserDatabaseRepository,
  KAFKA_TOPICS,
  UserEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type AddUserPinKafkaRequest = KafkaMessage<AddUserPinRequest>;
export type AddUserPinKafkaResponse = KafkaResponse<AddUserPinResponse>;

/**
 * Add user pin controller.
 */
@Controller()
@MicroserviceController()
export class AddUserPinMicroserviceController {
  /**
   * Parse update user pin message and call update user pin controller.
   *
   * @param userRepository User repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.ADD_USER_PIN)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @EventEmitterParam(UserEventKafkaEmitter)
    userEventEmitter: UserEventEmitterControllerInterface,
    @LoggerParam(AddUserPinMicroserviceController)
    logger: Logger,
    @Payload('value') message: AddUserPinRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<AddUserPinKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new AddUserPinRequest(message);

    logger.info('Add user pin.', { payload });

    // Create update user pin controller.
    const controller = new AddUserPinController(
      logger,
      userRepository,
      userEventEmitter,
    );

    // Add user pin.
    const updatedUser = await controller.execute(payload);

    logger.info('User pin added.', { updatedUser });

    return {
      ctx,
      value: updatedUser,
    };
  }
}
