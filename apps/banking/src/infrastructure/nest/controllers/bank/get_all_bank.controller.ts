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
import { BankRepository } from '@zro/banking/domain';
import {
  GetAllBankController,
  GetAllBankRequest,
  GetAllBankResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetAllBankKafkaRequest = KafkaMessage<GetAllBankRequest>;

export type GetAllBankKafkaResponse = KafkaResponse<GetAllBankResponse>;

/**
 * Bank controller.
 */
@Controller()
@MicroserviceController()
export class GetAllBankMicroserviceController {
  /**
   * Consumer of get banks.
   *
   * @param bankRepository Bank repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANK.GET_ALL)
  async execute(
    @RepositoryParam(BankDatabaseRepository)
    bankRepository: BankRepository,
    @LoggerParam(GetAllBankMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllBankRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllBankKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllBankRequest(message);

    // Create and call get banks controller.
    const controller = new GetAllBankController(logger, bankRepository);

    // Get banks
    const banks = await controller.execute(payload);

    logger.info('Banks found.', { banks });

    return {
      ctx,
      value: banks,
    };
  }
}
