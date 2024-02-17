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
  GetBankingTedByIdController,
  GetBankingTedByIdRequest,
  GetBankingTedByIdResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankingTedByIdKafkaRequest =
  KafkaMessage<GetBankingTedByIdRequest>;

export type GetBankingTedByIdKafkaResponse =
  KafkaResponse<GetBankingTedByIdResponse>;

/**
 * BankingTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankingTedByIdMicroserviceController {
  /**
   * Consumer of get bankingTed by id.
   *
   * @param bankingTedRepository BankingTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.GET_BY_ID)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @LoggerParam(GetBankingTedByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankingTedByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankingTedByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankingTedByIdRequest(message);

    logger.info('Getting bankingTed.', { payload });

    // Create and call get bankingTed by id controller.
    const controller = new GetBankingTedByIdController(
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
