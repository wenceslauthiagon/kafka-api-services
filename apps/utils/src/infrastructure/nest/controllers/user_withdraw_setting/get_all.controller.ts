import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import {
  KAFKA_TOPICS,
  UserWithdrawSettingDatabaseRepository,
} from '@zro/utils/infrastructure';
import {
  GetAllUserWithdrawSettingController,
  GetAllUserWithdrawSettingRequest,
  GetAllUserWithdrawSettingResponse,
} from '@zro/utils/interface';
import { UserWithdrawSettingRepository } from '@zro/utils/domain';

export type GetAllUserWithdrawSettingKafkaRequest =
  KafkaMessage<GetAllUserWithdrawSettingRequest>;

export type GetAllUserWithdrawSettingKafkaResponse =
  KafkaResponse<GetAllUserWithdrawSettingResponse>;

/**
 * Get all UserWithdrawSetting controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetAllUserWithdrawSettingMicroserviceController {
  /**
   * Consumer of get by user and wallet.
   *
   * @param withdrawRepository UserWithdrawSetting repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WITHDRAW_SETTING.GET_ALL)
  async execute(
    @RepositoryParam(UserWithdrawSettingDatabaseRepository)
    withdrawRepository: UserWithdrawSettingRepository,
    @LoggerParam(GetAllUserWithdrawSettingMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllUserWithdrawSettingRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllUserWithdrawSettingKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllUserWithdrawSettingRequest(message);

    // Create and call get by id controller.
    const controller = new GetAllUserWithdrawSettingController(
      logger,
      withdrawRepository,
    );

    const withdrawals = await controller.execute(payload);

    logger.info('User withdrawals permissions found.', {
      withdrawals: withdrawals,
    });

    return {
      ctx,
      value: withdrawals,
    };
  }
}
