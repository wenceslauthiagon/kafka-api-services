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
import { ExchangeContractRepository } from '@zro/otc/domain';
import {
  GetAllExchangeContractController,
  GetAllExchangeContractRequest,
  GetAllExchangeContractResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ExchangeContractDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetAllExchangeContractKafkaRequest =
  KafkaMessage<GetAllExchangeContractRequest>;

export type GetAllExchangeContractKafkaResponse =
  KafkaResponse<GetAllExchangeContractResponse>;

/**
 * ExchangeContract controller.
 */
@Controller()
@MicroserviceController()
export class GetAllExchangeContractMicroserviceController {
  /**
   * Consumer of get ExchangeContracts.
   *
   * @param exchangeContractRepository ExchangeContract repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EXCHANGE_CONTRACT.GET_ALL)
  async execute(
    @RepositoryParam(ExchangeContractDatabaseRepository)
    exchangeContractRepository: ExchangeContractRepository,
    @LoggerParam(GetAllExchangeContractMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllExchangeContractRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllExchangeContractKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllExchangeContractRequest(message);

    // Create and call get ExchangeContracts controller.
    const controller = new GetAllExchangeContractController(
      logger,
      exchangeContractRepository,
    );

    // Get ExchangeContracts
    const exchangeContracts = await controller.execute(payload);

    logger.info('ExchangeContracts found.', { exchangeContracts });

    return {
      ctx,
      value: exchangeContracts,
    };
  }
}
