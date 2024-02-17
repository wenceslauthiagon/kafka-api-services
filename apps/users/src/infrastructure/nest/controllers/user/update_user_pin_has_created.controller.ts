import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  UpdateUserPinHasCreatedController,
  UpdateUserPinHasCreatedRequest,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';
import {
  UserDatabaseRepository,
  KAFKA_TOPICS,
  UserEventKafkaEmitter,
} from '@zro/users/infrastructure';

export type UpdateUserPinHasCreatedKafkaRequest =
  KafkaMessage<UpdateUserPinHasCreatedRequest>;

/**
 * Update user pin has created controller.
 */
@Controller()
@MicroserviceController()
export class UpdateUserPinHasCreatedMicroserviceController {
  /**
   * Parse update user pin has created message and call update user pin has created controller.
   *
   * @param userRepository User repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.UPDATE_USER_PIN_HAS_CREATED)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @EventEmitterParam(UserEventKafkaEmitter)
    userEventEmitter: UserEventEmitterControllerInterface,
    @LoggerParam(UpdateUserPinHasCreatedMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateUserPinHasCreatedRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateUserPinHasCreatedRequest(message);

    logger.info('Update user pin has created.', { payload });

    // Create update user pin has created controller.
    const controller = new UpdateUserPinHasCreatedController(
      logger,
      userRepository,
      userEventEmitter,
    );

    // Update user pin has created.
    await controller.execute(payload);

    logger.info('User pin has created updated.');
  }
}
