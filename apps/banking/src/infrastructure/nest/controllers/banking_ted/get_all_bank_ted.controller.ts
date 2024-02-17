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
import { BankTedRepository } from '@zro/banking/domain';
import {
  GetAllBankTedController,
  GetAllBankTedRequest,
  GetAllBankTedResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAllBankTedKafkaRequest = KafkaMessage<GetAllBankTedRequest>;

export type GetAllBankTedKafkaResponse = KafkaResponse<GetAllBankTedResponse>;

/**
 * BankTed controller.
 */
@Controller()
@MicroserviceController()
export class GetAllBankTedMicroserviceController {
  /**
   * Consumer of get bankTeds.
   *
   * @param bankTedRepository BankTed repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANK_TED.GET_ALL)
  async execute(
    @RepositoryParam(BankTedDatabaseRepository)
    bankTedRepository: BankTedRepository,
    @LoggerParam(GetAllBankTedMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllBankTedRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllBankTedKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllBankTedRequest(message);

    // Create and call get bankTeds controller.
    const controller = new GetAllBankTedController(logger, bankTedRepository);

    // Get bankTeds
    const bankTeds = await controller.execute(payload);

    logger.info('BankTeds found.', { bankTeds });

    return {
      ctx,
      value: bankTeds,
    };
  }
}
