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
import { ConversionRepository } from '@zro/otc/domain';
import {
  GetConversionReceiptByUserAndOperationController,
  GetConversionReceiptByUserAndOperationRequest,
  GetConversionReceiptByUserAndOperationResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ConversionDatabaseRepository,
} from '@zro/otc/infrastructure';

export type GetConversionReceiptByUserAndOperationKafkaRequest =
  KafkaMessage<GetConversionReceiptByUserAndOperationRequest>;

export type GetConversionReceiptByUserAndOperationKafkaResponse =
  KafkaResponse<GetConversionReceiptByUserAndOperationResponse>;

/**
 * Conversion RPC controller.
 */
@Controller()
@MicroserviceController()
export class GetConversionReceiptByUserAndOperationMicroserviceController {
  /**
   * Consumer of get conversion receipt.
   *
   * @param conversionRepository Conversion repository.
   * @param message Request Kafka message.
   * @param logger Request logger.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.CONVERSION.GET_RECEIPT_BY_USER_AND_OPERATION,
  )
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @LoggerParam(GetConversionReceiptByUserAndOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetConversionReceiptByUserAndOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetConversionReceiptByUserAndOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetConversionReceiptByUserAndOperationRequest(message);

    logger.info('Getting conversion receipt.', { payload });

    // Create and call get conversion receipt controller.
    const controller = new GetConversionReceiptByUserAndOperationController(
      logger,
      conversionRepository,
    );

    // Get conversion
    const receipt = await controller.execute(payload);

    logger.info('Conversion receipt.', { receipt });

    return {
      ctx,
      value: receipt,
    };
  }
}
