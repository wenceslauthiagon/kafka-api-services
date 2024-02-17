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
  UploadExchangeContractFileController,
  UploadExchangeContractFileRequest,
  UploadExchangeContractFileResponse,
} from '@zro/otc/interface';
import {
  ExchangeContractDatabaseRepository,
  KAFKA_TOPICS,
} from '@zro/otc/infrastructure';

export type UploadExchangeContractFileKafkaRequest =
  KafkaMessage<UploadExchangeContractFileRequest>;

export type UploadExchangeContractFileKafkaResponse =
  KafkaResponse<UploadExchangeContractFileResponse>;

/**
 * Upload exchange contract file controller.
 */
@Controller()
@MicroserviceController()
export class UploadExchangeContractFileMicroserviceController {
  /**
   *
   * @param exchangeContractRepository Exchange contract repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.EXCHANGE_CONTRACT.UPLOAD_FILE)
  async execute(
    @RepositoryParam(ExchangeContractDatabaseRepository)
    exchangeContractRepository: ExchangeContractRepository,
    @LoggerParam(UploadExchangeContractFileMicroserviceController)
    logger: Logger,
    @Payload('value') message: UploadExchangeContractFileRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<UploadExchangeContractFileKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new UploadExchangeContractFileRequest(message);

    logger.info('Update exchange contract file', { payload });

    // Create upload exchange contract controller.
    const controller = new UploadExchangeContractFileController(
      logger,
      exchangeContractRepository,
    );

    // Update exchange contract file by controller.
    const updatedExchangeContract = await controller.execute(payload);

    logger.info('Exchange contract file updated.', { updatedExchangeContract });

    return {
      ctx,
      value: updatedExchangeContract,
    };
  }
}
