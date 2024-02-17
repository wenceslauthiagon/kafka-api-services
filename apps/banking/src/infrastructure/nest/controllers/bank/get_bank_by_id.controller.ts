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
import { BankRepository } from '@zro/banking/domain';
import {
  GetBankByIdController,
  GetBankByIdRequest,
  GetBankByIdResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankByIdKafkaRequest = KafkaMessage<GetBankByIdRequest>;

export type GetBankByIdKafkaResponse = KafkaResponse<GetBankByIdResponse>;

/**
 * Bank RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankByIdMicroserviceController {
  /**
   * Consumer of get bank by id.
   *
   * @param bankRepository Bank repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANK.GET_BY_ID)
  async execute(
    @RepositoryParam(BankDatabaseRepository)
    bankRepository: BankRepository,
    @LoggerParam(GetBankByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankByIdRequest(message);

    logger.info('Getting bank.', { id: payload.id });

    // Create and call get bank by id controller.
    const controller = new GetBankByIdController(logger, bankRepository);

    // Get bank
    const bank = await controller.execute(payload);

    logger.info('Bank found.', { bank });

    return {
      ctx,
      value: bank,
    };
  }
}
