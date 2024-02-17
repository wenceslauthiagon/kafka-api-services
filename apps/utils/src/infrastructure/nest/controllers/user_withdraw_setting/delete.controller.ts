import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  KAFKA_TOPICS,
  UserWithdrawSettingDatabaseRepository,
} from '@zro/utils/infrastructure';
import {
  DeleteUserWithdrawSettingController,
  DeleteUserWithdrawSettingRequest,
} from '@zro/utils/interface';
import { UserWithdrawSettingRepository } from '@zro/utils/domain';

export type DeleteUserWithdrawSettingKafkaRequest =
  KafkaMessage<DeleteUserWithdrawSettingRequest>;

/**
 * Delete UserWithdrawSetting controller.
 */
@Controller()
@MicroserviceController()
export class DeleteUserWithdrawSettingMicroserviceController {
  /**
   * Consumer of delete user withdraw setting.
   *
   * @param withdrawRepository UserWithdrawSetting repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WITHDRAW_SETTING.DELETE)
  async execute(
    @RepositoryParam(UserWithdrawSettingDatabaseRepository)
    withdrawRepository: UserWithdrawSettingRepository,
    @LoggerParam(DeleteUserWithdrawSettingMicroserviceController)
    logger: Logger,
    @Payload('value') message: DeleteUserWithdrawSettingRequest,
  ): Promise<void> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new DeleteUserWithdrawSettingRequest(message);

    // Create and call delete by id controller.
    const controller = new DeleteUserWithdrawSettingController(
      logger,
      withdrawRepository,
    );

    await controller.execute(payload);

    logger.info('User withdraw deleted.');
  }
}
