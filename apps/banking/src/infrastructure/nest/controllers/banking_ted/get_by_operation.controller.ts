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
  GetBankingTedByOperationController,
  GetBankingTedByOperationRequest,
  GetBankingTedByOperationResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankingTedByOperationKafkaRequest =
  KafkaMessage<GetBankingTedByOperationRequest>;

export type GetBankingTedByOperationKafkaResponse =
  KafkaResponse<GetBankingTedByOperationResponse>;

/**
 * BankingTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankingTedByOperationMicroserviceController {
  /**
   * Consumer of get BankingTed by Operation.
   *
   * @param bankingTedRepository BankingTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.GET_BY_OPERATION)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @LoggerParam(GetBankingTedByOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankingTedByOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankingTedByOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankingTedByOperationRequest(message);

    logger.info('Getting BankingTed.', { payload });

    // Create and call get BankingTed by Operation controller.
    const controller = new GetBankingTedByOperationController(
      logger,
      bankingTedRepository,
    );

    // Get BankingTed
    const bankingTed = await controller.execute(payload);

    logger.info('BankingTed found.', { bankingTed });

    return {
      ctx,
      value: bankingTed,
    };
  }
}
