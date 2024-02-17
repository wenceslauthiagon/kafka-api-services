import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
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
  GetAllBankingTedController,
  GetAllBankingTedRequest,
  GetAllBankingTedResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAllBankingTedKafkaRequest =
  KafkaMessage<GetAllBankingTedRequest>;

export type GetAllBankingTedKafkaResponse =
  KafkaResponse<GetAllBankingTedResponse>;

/**
 * BankingTed controller.
 */
@Controller()
@MicroserviceController()
export class GetAllBankingTedMicroserviceController {
  /**
   * Consumer of get bankingTeds.
   *
   * @param bankingTedRepository BankingTed repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANKING_TED.GET_ALL)
  async execute(
    @RepositoryParam(BankingTedDatabaseRepository)
    bankingTedRepository: BankingTedRepository,
    @LoggerParam(GetAllBankingTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllBankingTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllBankingTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllBankingTedRequest(message);

    // Create and call get bankingTeds controller.
    const controller = new GetAllBankingTedController(
      logger,
      bankingTedRepository,
    );

    // Get bankingTeds
    const bankingTeds = await controller.execute(payload);

    logger.info('BankingTeds found.', { bankingTeds });

    return {
      ctx,
      value: bankingTeds,
    };
  }
}
