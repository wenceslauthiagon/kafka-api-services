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
import { BankingTedRepository } from '@zro/banking/domain';
import {
  GetBankingTedByTransactionIdController,
  GetBankingTedByTransactionIdRequest,
  GetBankingTedByTransactionIdResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankingTedByTransactionIdKafkaRequest =
  KafkaMessage<GetBankingTedByTransactionIdRequest>;

export type GetBankingTedByTransactionIdKafkaResponse =
  KafkaResponse<GetBankingTedByTransactionIdResponse>;

/**
 * BankingTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankingTedByTransactionIdMicroserviceController {
  /**
   * Consumer of get bankingTed by transactionId.
   *
   * @param bankingTedRepository BankingTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.GET_BY_TRANSACTION_ID)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @LoggerParam(GetBankingTedByTransactionIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankingTedByTransactionIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankingTedByTransactionIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankingTedByTransactionIdRequest(message);

    logger.info('Getting bankingTed.', { payload });

    // Create and call get bankingTed by transactionId controller.
    const controller = new GetBankingTedByTransactionIdController(
      logger,
      bankingTedRepository,
    );

    // Get bankingTed
    const bankingTed = await controller.execute(payload);

    logger.info('BankingTed found.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
