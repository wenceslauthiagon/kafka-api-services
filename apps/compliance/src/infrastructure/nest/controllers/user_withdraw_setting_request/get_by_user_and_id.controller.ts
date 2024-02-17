import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserWithdrawSettingRequestRepository } from '@zro/compliance/domain';
import {
  GetUserWithdrawSettingRequestByUserAndIdRequest,
  GetUserWithdrawSettingRequestByUserAndIdController,
  GetUserWithdrawSettingRequestByUserAndIdResponse,
} from '@zro/compliance/interface';
import {
  KAFKA_TOPICS,
  UserWithdrawSettingRequestDatabaseRepository,
} from '@zro/compliance/infrastructure';

export type GetUserWithdrawSettingRequestByUserAndIdKafkaRequest =
  KafkaMessage<GetUserWithdrawSettingRequestByUserAndIdRequest>;

export type GetUserWithdrawSettingRequestByUserAndIdKafkaResponse =
  KafkaResponse<GetUserWithdrawSettingRequestByUserAndIdResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserWithdrawSettingRequestByUserAndIdMicroserviceController {
  /**
   * Consumer of get user withdraw setting request by user and id.
   *
   * @param userRepository User repository.
   * @param message RequestByUserAndId Kafka message.
   * @param logger RequestByUserAndId logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.GET_BY_USER_AND_ID,
  )
  async execute(
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @LoggerParam(GetUserWithdrawSettingRequestByUserAndIdMicroserviceController)
    logger: Logger,
    @Payload('value')
    message: GetUserWithdrawSettingRequestByUserAndIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserWithdrawSettingRequestByUserAndIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new GetUserWithdrawSettingRequestByUserAndIdRequest(
      message,
    );

    // Get and call get user withdraw setting request by user and id controller.
    const controller = new GetUserWithdrawSettingRequestByUserAndIdController(
      logger,
      userWithdrawSettingRequestRepository,
    );

    // Get user withdraw setting by user and id request.
    const userWithdrawSettingRequest = await controller.execute(payload);

    logger.info('Get User withdraw setting request response.', {
      userWithdrawSettingRequest,
    });

    return {
      ctx,
      value: userWithdrawSettingRequest,
    };
  }
}
