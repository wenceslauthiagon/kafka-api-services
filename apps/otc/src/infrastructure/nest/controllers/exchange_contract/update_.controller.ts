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
import { ExchangeContractRepository } from '@zro/otc/domain';
import {
  UpdateExchangeContractController,
  UpdateExchangeContractRequest,
  UpdateExchangeContractResponse,
} from '@zro/otc/interface';
import {
  ExchangeContractDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';

export type UpdateExchangeContractKafkaRequest =
  KafkaMessage<UpdateExchangeContractRequest>;

export type UpdateExchangeContractKafkaResponse =
  KafkaResponse<UpdateExchangeContractResponse>;

/**
 * Update exchange contract controller.
 */
@Controller()
@MicroserviceController()
export class UpdateExchangeContractMicroserviceController {
  /**
   *
   * @param exchangeContractRepository Exchange contract repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EXCHANGE_CONTRACT.UPDATE)
  async execute(
    @RepositoryParam(ExchangeContractDatabaseRepository)
    exchangeContractRepository: ExchangeContractRepository,
    @LoggerParam(UpdateExchangeContractMicroserviceController)
    logger: Logger,
    @Payload('value') message: UpdateExchangeContractRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UpdateExchangeContractKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UpdateExchangeContractRequest(message);

    logger.info('Update exchange contract', { payload });

    // Create update exchange contract controller.
    const controller = new UpdateExchangeContractController(
      logger,
      exchangeContractRepository,
    );

    // Update exchange contract by controller.
    const updatedExchangeContract = await controller.execute(payload);

    logger.info('Exchange contract updated.', { updatedExchangeContract });

    return {
      ctx,
      value: updatedExchangeContract,
    };
  }
}
