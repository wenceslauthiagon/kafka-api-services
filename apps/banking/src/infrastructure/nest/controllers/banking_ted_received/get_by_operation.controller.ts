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
import { BankingTedReceivedRepository } from '@zro/banking/domain';
import {
  GetBankingTedReceivedByOperationController,
  GetBankingTedReceivedByOperationRequest,
  GetBankingTedReceivedByOperationResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedReceivedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankingTedReceivedByOperationKafkaRequest =
  KafkaMessage<GetBankingTedReceivedByOperationRequest>;

export type GetBankingTedReceivedByOperationKafkaResponse =
  KafkaResponse<GetBankingTedReceivedByOperationResponse>;

/**
 * BankingTedReceived RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankingTedReceivedByOperationMicroserviceController {
  /**
   * Consumer of get BankingTedReceived by Operation.
   *
   * @param bankingTedReceivedRepository BankingTedReceived repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED_RECEIVED.GET_BY_OPERATION)
  async execute(
    @RepositoryParam(BankingTedReceivedDatabaseRepository)
    bankingTedReceivedRepository: BankingTedReceivedRepository,
    @LoggerParam(GetBankingTedReceivedByOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankingTedReceivedByOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankingTedReceivedByOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankingTedReceivedByOperationRequest(message);

    logger.info('Getting BankingTedReceived.', { payload });

    // Create and call get BankingTedReceived by Operation controller.
    const controller = new GetBankingTedReceivedByOperationController(
      logger,
      bankingTedReceivedRepository,
    );

    // Get BankingTedReceived
    const bankingTedReceived = await controller.execute(payload);

    logger.info('BankingTedReceived found.', { bankingTedReceived });

    return {
      ctx,
      value: bankingTedReceived,
    };
  }
}
