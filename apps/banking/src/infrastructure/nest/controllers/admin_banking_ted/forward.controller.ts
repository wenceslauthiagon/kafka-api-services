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
  ForwardAdminBankingTedResponse,
  ForwardAdminBankingTedController,
  ForwardAdminBankingTedRequest,
  AdminBankingTedEventEmitterControllerInterface,
} from '@zro/banking/interface';

export type ForwardAdminBankingTedKafkaRequest =
  KafkaMessage<ForwardAdminBankingTedRequest>;

export type ForwardAdminBankingTedKafkaResponse =
  KafkaResponse<ForwardAdminBankingTedResponse>;

@Controller()
@MicroserviceController()
export class ForwardAdminBankingTedMicroserviceController {
  /**
   * Consumer of foward bankingTed.
   * @param {AdminBankingTedRepository} bankingTedRepository AdminBankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {ForwardAdminBankingTedKafkaRequest} message Request Kafka message.
   * @returns {ForwardAdminBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.ADMIN_BANKING_TED.FORWARD)
  async execute(
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    bankingTedRepository: AdminBankingTedRepository,
    @EventEmitterParam(AdminBankingTedEventKafkaEmitter)
    bankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
    @LoggerParam(ForwardAdminBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: ForwardAdminBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ForwardAdminBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ForwardAdminBankingTedRequest(message);

    // Forward and call bankingTed controller.
    const controller = new ForwardAdminBankingTedController(
      logger,
      bankingTedRepository,
      bankingTedEmitter,
    );

    // Call bankingTed controller
    const bankingTed = await controller.execute(payload);

    // Forward bankingTed
    logger.info('AdminBankingTed forwarded.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
