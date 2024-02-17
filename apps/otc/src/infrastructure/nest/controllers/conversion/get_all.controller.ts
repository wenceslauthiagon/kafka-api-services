import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  RepositoryParam,
} from '@zro/common';
import { ConversionRepository } from '@zro/otc/domain';
import {
  GetAllConversionController,
  GetAllConversionRequest,
  GetAllConversionResponse,
} from '@zro/otc/interface';
import {
  KAFKA_TOPICS,
  ConversionDatabaseRepository,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';

export type GetAllConversionKafkaRequest =
  KafkaMessage<GetAllConversionRequest>;

export type GetAllConversionKafkaResponse =
  KafkaResponse<GetAllConversionResponse>;

/**
 * Conversion controller.
 */
@Controller()
@MicroserviceController()
export class GetAllConversionMicroserviceController {
  /**
   * Consumer of get conversions.
   *
   * @param conversionRepository Conversion repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CONVERSION.GET_ALL)
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(GetAllConversionMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetAllConversionRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetAllConversionKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetAllConversionRequest(message);

    // Create and call get conversions controller.
    const controller = new GetAllConversionController(
      logger,
      conversionRepository,
      operationService,
      quotationService,
    );

    // Get conversions
    const conversions = await controller.execute(payload);

    logger.info('Conversions found.', { conversions });

    return {
      ctx,
      value: conversions,
    };
  }
}
