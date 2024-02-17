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
import {
  AdminBankingAccountRepository,
  AdminBankingTedRepository,
} from '@zro/banking/domain';
import {
  CreateAdminBankingTedResponse,
  CreateAdminBankingTedController,
  CreateAdminBankingTedRequest,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  AdminBankingTedDatabaseRepository,
  AdminBankingAccountDatabaseRepository,
  AdminBankingTedEventKafkaEmitter,
} from '@zro/banking/infrastructure';

export type CreateAdminBankingTedKafkaRequest =
  KafkaMessage<CreateAdminBankingTedRequest>;

export type CreateAdminBankingTedKafkaResponse =
  KafkaResponse<CreateAdminBankingTedResponse>;

@Controller()
@MicroserviceController()
export class CreateAdminBankingTedMicroserviceController {
  /**
   * Consumer of create adminBankingTed.
   * @param {AdminBankingTedRepository} adminBankingTedRepository AdminBankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {CreateAdminBankingTedKafkaRequest} message Request Kafka message.
   * @returns {CreateAdminBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_TED.CREATE)
  async execute(
    @RepositoryParam(AdminBankingAccountDatabaseRepository)
    adminBankingAccountRepository: AdminBankingAccountRepository,
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    adminBankingTedRepository: AdminBankingTedRepository,
    @EventEmitterParam(AdminBankingTedEventKafkaEmitter)
    emitter: AdminBankingTedEventEmitterControllerInterface,
    @LoggerParam(CreateAdminBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: CreateAdminBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<CreateAdminBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new CreateAdminBankingTedRequest(message);

    // Create and call adminBankingTed controller.
    const controller = new CreateAdminBankingTedController(
      logger,
      adminBankingTedRepository,
      adminBankingAccountRepository,
      emitter,
    );

    // Call adminBankingTed controller
    const adminBankingTed = await controller.execute(payload);

    // Create adminBankingTed
    logger.info('AdminBankingTed created.', { adminBankingTed });

    return {
      ctx,
      value: adminBankingTed,
    };
  }
}
