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
  GetBankByIspbController,
  GetBankByIspbRequest,
  GetBankByIspbResponse,
} from '@zro/banking/interface';
import {
  KAFKA_TOPICS,
  BankDatabaseRepository,
} from '@zro/banking/infrastructure';

export type GetBankByIspbKafkaRequest = KafkaMessage<GetBankByIspbRequest>;

export type GetBankByIspbKafkaResponse = KafkaResponse<GetBankByIspbResponse>;

/**
 * Bank RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetBankByIspbMicroserviceController {
  /**
   * Consumer of get bank by ispb.
   *
   * @param bankRepository Bank repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.BANK.GET_BY_ISPB)
  async execute(
    @RepositoryParam(BankDatabaseRepository)
    bankRepository: BankRepository,
    @LoggerParam(GetBankByIspbMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetBankByIspbRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetBankByIspbKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetBankByIspbRequest(message);

    logger.info('Getting bank.', { ispb: payload.ispb });

    // Create and call get bank by ispb controller.
    const controller = new GetBankByIspbController(logger, bankRepository);

    // Get bank
    const bank = await controller.execute(payload);

    logger.info('Bank found.', { bank });

    return {
      ctx,
      value: bank,
    };
  }
}
