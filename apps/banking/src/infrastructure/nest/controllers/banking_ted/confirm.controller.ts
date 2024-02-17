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
  BankingTedRepository,
  AdminBankingAccountRepository,
  AdminBankingTedRepository,
} from '@zro/banking/domain';
import {
  AdminBankingTedEventEmitterControllerInterface,
  BankingTedEventEmitterControllerInterface,
  ConfirmTedController,
  ConfirmTedRequest,
  ConfirmTedResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
  AdminBankingAccountDatabaseRepository,
  AdminBankingTedDatabaseRepository,
  BankingTedEventKafkaEmitter,
  AdminBankingTedEventKafkaEmitter,
} from '@zro/banking/infrastructure';

export type ConfirmBankingTedKafkaRequest = KafkaMessage<ConfirmTedRequest>;

export type ConfirmBankingTedKafkaResponse = KafkaResponse<ConfirmTedResponse>;

@Controller()
@MicroserviceController()
export class ConfirmBankingTedMicroserviceController {
  /**
   * Consumer of confirm bankingTed.
   * @param {BankingTedRepository} bankingTedRepository BankingTed repository.
   * @param {Logger} logger Request logger.
   * @param {ConfirmBankingTedKafkaRequest} message Request Kafka message.
   * @returns {ConfirmBankingTedKafkaResponse} Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.CONFIRM)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @RepositoryParam(AdminBankingAccountDatabaseRepository)
    adminBankingAccountRepository: AdminBankingAccountRepository,
    @RepositoryParam(AdminBankingTedDatabaseRepository)
    adminBankingTedRepository: AdminBankingTedRepository,
    @EventEmitterParam(BankingTedEventKafkaEmitter)
    bankingTedEmitter: BankingTedEventEmitterControllerInterface,
    @EventEmitterParam(AdminBankingTedEventKafkaEmitter)
    adminBankingTedEmitter: AdminBankingTedEventEmitterControllerInterface,
    @LoggerParam(ConfirmBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: ConfirmTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<ConfirmBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new ConfirmTedRequest(message);

    // Create and call bankingTed controller.
    const controller = new ConfirmTedController(
      logger,
      bankingTedRepository,
      adminBankingTedRepository,
      adminBankingAccountRepository,
      bankingTedEmitter,
      adminBankingTedEmitter,
    );

    // Call bankingTed controller
    const bankingTed = await controller.execute(payload);

    // Create bankingTed
    logger.info('BankingTed created.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
