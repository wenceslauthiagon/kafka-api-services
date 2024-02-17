import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import {
  CacheTTL,
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
  KAFKA_TOPICS,
  ConversionDatabaseRepository,
  OperationServiceKafka,
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import {
  GetConversionByUserAndIdController,
  GetConversionByUserAndIdRequest,
  GetConversionByUserAndIdResponse,
} from '@zro/otc/interface';

export type GetConversionByUserAndIdKafkaRequest =
  KafkaMessage<GetConversionByUserAndIdRequest>;

export type GetConversionByUserAndIdKafkaResponse =
  KafkaResponse<GetConversionByUserAndIdResponse>;

/**
 * Conversion controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetConversionByUserAndIdMicroserviceController {
  /**
   * Consumer of get conversion by user and id.
   *
   * @param conversionRepository Conversion repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CONVERSION.GET_BY_USER_AND_ID)
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @KafkaServiceParam(OperationServiceKafka)
    operationService: OperationServiceKafka,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(GetConversionByUserAndIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetConversionByUserAndIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetConversionByUserAndIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetConversionByUserAndIdRequest(message);

    // Create and call get conversion by user and id controller.
    const controller = new GetConversionByUserAndIdController(
      logger,
      conversionRepository,
      operationService,
      quotationService,
    );

    const conversion = await controller.execute(payload);

    logger.info('Conversion found.', { conversion });

    return {
      ctx,
      value: conversion,
    };
  }
}
