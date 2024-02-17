import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserWithdrawSettingRequestRepository } from '@zro/compliance/domain';
import { UtilService } from '@zro/compliance/application';
import {
  CloseUserWithdrawSettingRequest,
  CloseUserWithdrawSettingRequestController,
  CloseUserWithdrawSettingResponse,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  KAFKA_TOPICS,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestEventKafkaEmitter,
  UtilServiceKafka,
} from '@zro/compliance/infrastructure';

export type CloseUserWithdrawSettingRequestKafkaRequest =
  KafkaMessage<CloseUserWithdrawSettingRequest>;

export type CloseUserWithdrawSettingRequestKafkaResponse =
  KafkaResponse<CloseUserWithdrawSettingResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class CloseUserWithdrawSettingRequestMicroserviceController {
  /**
   * Consumer of close user withdraw setting request.
   *
   * @param userRepository User withdraw setting request  repository.
   * @param eventEmitter User withdraw setting request event emitter.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.CLOSE)
  async execute(
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @EventEmitterParam(UserWithdrawSettingRequestEventKafkaEmitter)
    userWithdrawSettingRequestEventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
    @KafkaServiceParam(UtilServiceKafka)
    utilService: UtilService,
    @LoggerParam(CloseUserWithdrawSettingRequestMicroserviceController)
    logger: Logger,
    @Payload('value') message: CloseUserWithdrawSettingRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CloseUserWithdrawSettingRequestKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CloseUserWithdrawSettingRequest(message);

    // Close and call create user withdraw setting request controller.
    const controller = new CloseUserWithdrawSettingRequestController(
      logger,
      userWithdrawSettingRequestRepository,
      userWithdrawSettingRequestEventEmitter,
      utilService,
    );

    // Close user withdraw setting request
    const userWithdrawSettingRequest = await controller.execute(payload);

    logger.info('User withdraw setting request closed.', {
      userWithdrawSettingRequest,
    });

    return {
      ctx,
      value: userWithdrawSettingRequest,
    };
  }
}
