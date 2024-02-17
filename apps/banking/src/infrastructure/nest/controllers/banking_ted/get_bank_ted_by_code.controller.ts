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
import { BankTedRepository } from '@zro/banking/domain';
import {
  GetBankTedByCodeController,
  GetBankTedByCodeRequest,
  GetBankTedByCodeResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankTedDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankTedByCodeKafkaRequest =
  KafkaMessage<GetBankTedByCodeRequest>;

export type GetBankTedByCodeKafkaResponse =
  KafkaResponse<GetBankTedByCodeResponse>;

/**
 * BankTed RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankTedByCodeMicroserviceController {
  /**
   * Consumer of get bankTed by code.
   *
   * @param bankTedRepository BankTed repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANK_TED.GET_BY_CODE)
  async execute(
    @RepositoryParam(BankTedDatabaseRepository)
    bankTedRepository: BankTedRepository,
    @LoggerParam(GetBankTedByCodeMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankTedByCodeRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankTedByCodeKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankTedByCodeRequest(message);

    logger.info('Getting bankTed.', { payload });

    // Create and call get bankTed by code controller.
    const controller = new GetBankTedByCodeController(
      logger,
      bankTedRepository,
    );

    // Get bankTed
    const bankTed = await controller.execute(payload);

    logger.info('BankTed found.', { bankTed });

    return {
      ctx,
      value: bankTed,
    };
  }
}
