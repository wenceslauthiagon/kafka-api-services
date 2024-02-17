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
} from '@zro/compliance/application';
import {
  CreateUserWithdrawSettingRequest,
  CreateUserWithdrawSettingRequestController,
  CreateUserWithdrawSettingRequestResponse,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';
import {
  KAFKA_EVENTS,
  KAFKA_TOPICS,
  OperationServiceKafka,
  PixKeyServiceKafka,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestEventKafkaEmitter,
} from '@zro/compliance/infrastructure';

export type CreateUserWithdrawSettingRequestKafkaRequest =
  KafkaMessage<CreateUserWithdrawSettingRequest>;

export type CreateUserWithdrawSettingRequestKafkaResponse =
  KafkaResponse<CreateUserWithdrawSettingRequestResponse>;

/**
 * Compliance RPC controller.
 */
@Controller()
@MicroserviceController()
export class CreateUserWithdrawSettingRequestMicroserviceController {
  constructor(private readonly kafkaService: KafkaService) {}

  /**
   * Consumer of create user withdraw setting request.
   *
   * @param userRepository User repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.USER_WITHDRAW_SETTING_REQUEST.CREATE)
  async execute(
    @RepositoryParam(UserWithdrawSettingRequestDatabaseRepository)
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    @EventEmitterParam(UserWithdrawSettingRequestEventKafkaEmitter)
    userWithdrawSettingRequestEventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationService,
    @KafkaServiceParam(PixKeyServiceKafka)
    pixKeyService: PixKeyService,
    @LoggerParam(CreateUserWithdrawSettingRequestMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateUserWithdrawSettingRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateUserWithdrawSettingRequestKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Load and validate message payload.
    const payload = new CreateUserWithdrawSettingRequest(message);

    // Create and call create user withdraw setting request controller.
    const controller = new CreateUserWithdrawSettingRequestController(
      logger,
      userWithdrawSettingRequestRepository,
      operationService,
      pixKeyService,
      userWithdrawSettingRequestEventEmitter,
    );

    try {
      // Create user withdraw setting request
      const userWithdrawSettingRequest = await controller.execute(payload);

      logger.info('User withdraw setting request created.', {
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
