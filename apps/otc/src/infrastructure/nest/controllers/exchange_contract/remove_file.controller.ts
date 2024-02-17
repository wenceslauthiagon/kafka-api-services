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
  RemoveExchangeContractFileController,
  RemoveExchangeContractFileRequest,
  RemoveExchangeContractFileResponse,
} from '@zro/otc/interface';
import {
  ExchangeContractDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';

export type RemoveExchangeContractFileKafkaRequest =
  KafkaMessage<RemoveExchangeContractFileRequest>;

export type RemoveExchangeContractFileKafkaResponse =
  KafkaResponse<RemoveExchangeContractFileResponse>;

/**
 * Remove exchange contract file controller.
 */
@Controller()
@MicroserviceController()
export class RemoveExchangeContractFileMicroserviceController {
  /**
   *
   * @param exchangeContractRepository Exchange contract repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EXCHANGE_CONTRACT.REMOVE_FILE)
  async execute(
    @RepositoryParam(ExchangeContractDatabaseRepository)
    exchangeContractRepository: ExchangeContractRepository,
    @LoggerParam(RemoveExchangeContractFileMicroserviceController)
    logger: Logger,
    @Payload('value') message: RemoveExchangeContractFileRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<RemoveExchangeContractFileKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new RemoveExchangeContractFileRequest(message);

    logger.info('Remove exchange contract file.', { payload });

    // Remove exchange contract file controller.
    const controller = new RemoveExchangeContractFileController(
      logger,
      exchangeContractRepository,
    );

    // Update exchange contract file by controller.
    const updatedExchangeContract = await controller.execute(payload);

    logger.info('Exchange contract file updated without file.', {
      updatedExchangeContract,
    });

    return {
      ctx,
      value: updatedExchangeContract,
    };
  }
}
