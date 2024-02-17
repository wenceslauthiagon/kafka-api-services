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
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByPhoneNumberController,
  GetUserByPhoneNumberRequest,
  GetUserByPhoneNumberResponse,
} from '@zro/users/interface';
import {
  KAFKA_TOPICS,
  UserDatabaseRepository,
} from '@zro/users/infrastructure';

export type GetUserByPhoneNumberKafkaRequest =
  KafkaMessage<GetUserByPhoneNumberRequest>;
export type GetUserByPhoneNumberKafkaResponse =
  KafkaResponse<GetUserByPhoneNumberResponse>;

/**
 * User RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetUserByPhoneNumberMicroserviceController {
  /**
   * Consumer of get user by phone number.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER.GET_BY_PHONE_NUMBER)
  async execute(
    @RepositoryParam(UserDatabaseRepository)
    userRepository: UserRepository,
    @LoggerParam(GetUserByPhoneNumberMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetUserByPhoneNumberRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetUserByPhoneNumberKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetUserByPhoneNumberRequest(message);

    logger.info('Getting user.', { payload });

    // Create and call get user by phone number controller.
    const controller = new GetUserByPhoneNumberController(
      logger,
      userRepository,
    );

    // Get user
    const user = await controller.execute(payload);

    logger.info('User found.');

    return {
      ctx,
      value: user,
    };
  }
}
