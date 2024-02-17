import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  EventEmitterParam,
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaService,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { UserWithdrawSettingRequestRepository } from '@zro/compliance/domain';
import {
  OperationService,
  PixKeyService,
  UserWithdrawSettingRequestDocumentWrongException,
  UtilService,
} from '@zro/compliance/application';
import {
  CreateApproveUserWithdrawSettingRequest,
  CreateApproveUserWithdrawSettingRequestController,
  CreateApproveUserWithdrawSettingRequestResponse,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  KAFKA_EVENTS,
  KAFKA_TOPICS,
  OperationServiceKafka,
  PixKeyServiceKafka,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestEventKafkaEmitter,
  UtilServiceKafka,
} from '@zro/compliance/infrastructure';

export type CreateApproveUserWithdrawSettingRequestKafkaRequest =
  KafkaMessage<CreateApproveUserWithdrawSettingRequest>;

export type CreateApproveUserWithdrawSettingRequestKafkaResponse =
  KafkaResponse<CreateApproveUserWithdrawSettingRequestResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateApproveUserWithdrawSettingRequestMicroserviceController {
  constructor(private readonly kafkaService: KafkaService) {}

  /**
   * Consumer of create user withdraw setting request.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param operationService Operation service gateway.
   * @param pixKeyService Service to access Kafka.
   * @param utilService Util service.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.CREATE_APPROVE,
  )
  async execute(
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @EventEmitterParam(UserWithdrawSettingRequestEventKafkaEmitter)
    userWithdrawSettingRequestEventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyService,
    @KafkaServiceParam(UtilServiceKafka)
    utilService: UtilService,
    @LoggerParam(CreateApproveUserWithdrawSettingRequestMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateApproveUserWithdrawSettingRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateApproveUserWithdrawSettingRequestKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateApproveUserWithdrawSettingRequest(message);

    // Create and call create user withdraw setting request controller.
    const controller = new CreateApproveUserWithdrawSettingRequestController(
      logger,
      userWithdrawSettingRequestRepository,
      operationService,
      pixKeyService,
      userWithdrawSettingRequestEventEmitter,
      utilService,
    );

    try {
      // Create user withdraw setting request
      const userWithdrawSettingRequest = await controller.execute(payload);

      logger.info('Approve user withdraw setting request created.', {
        userWithdrawSettingRequest,
      });

      return {
        ctx,
        value: userWithdrawSettingRequest,
      };
    } catch (error) {
      if (error instanceof UserWithdrawSettingRequestDocumentWrongException) {
        await this.kafkaService.emit(
          KAFKA_EVENTS.USER_WITHDRAW_SETTING_REQUEST.FAILED_BY_DOCUMENT,
          { ...ctx.getMessage(), value: JSON.stringify(error.data) },
        );
      }

      throw error;
    }
  }
}
