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
import { AdminBankingTedRepository } from '@zro/banking/domain';
import {
  KAFKA_TOPICS,
  AdminBankingTedDatabaseRepository,
  AdminBankingTedEventKafkaEmitter,
} from '@zro/banking/infrastructure';
import {
  RejectAdminBankingTedResponse,
  RejectAdminBankingTedController,
  RejectAdminBankingTedRequest,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

export type RejectAdminBankingTedKafkaRequest =
  KafkaMessage<RejectAdminBankingTedRequest>;

export type RejectAdminBankingTedKafkaResponse =
  KafkaResponse<RejectAdminBankingTedResponse>;

@Controller()
@MicroserviceController()
export class RejectAdminBankingTedMicroserviceController {
  /**
   * Consumer of reject adminBankingTed.
   * @param {AdminBankingTedRepository} repository AdminBankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {RejectAdminBankingTedKafkaRequest} message Request Kafka message.
   * @returns {RejectAdminBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_TED.REJECT)
  async execute(
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    repository: AdminBankingTedRepository,
    @EventEmitterParam(AdminBankingTedEventKafkaEmitter)
    emitter: AdminBankingTedEventEmitterControllerInterface,
    @LoggerParam(RejectAdminBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: RejectAdminBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<RejectAdminBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new RejectAdminBankingTedRequest(message);

    // Reject and call adminBankingTed controller.
    const controller = new RejectAdminBankingTedController(
      logger,
      repository,
      emitter,
    );

    // Call adminBankingTed controller
    const adminBankingTed = await controller.execute(payload);

    // Reject adminBankingTed
    logger.info('AdminBankingTed completed.', { adminBankingTed });

    return {
      ctx,
      value: adminBankingTed,
    };
  }
}
