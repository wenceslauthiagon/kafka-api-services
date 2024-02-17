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
  QuotationServiceKafka,
} from '@zro/otc/infrastructure';
import {
  GetQuotationByConversionIdAndUserController,
  GetQuotationByConversionIdAndUserRequest,
  GetQuotationByConversionIdAndUserResponse,
} from '@zro/otc/interface';

export type GetQuotationByConversionIdAndUserKafkaRequest =
  KafkaMessage<GetQuotationByConversionIdAndUserRequest>;

export type GetQuotationByConversionIdAndUserKafkaResponse =
  KafkaResponse<GetQuotationByConversionIdAndUserResponse>;

/**
 * Conversion controller.
 */
@Controller()
@CacheTTL()
@MicroserviceController()
export class GetQuotationByConversionIdAndUserMicroserviceController {
  /**
   * Consumer of get quotation by conversion id and user.
   *
   * @param conversionRepository Conversion repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.CONVERSION.GET_QUOTATION_BY_CONVERSION_ID_AND_USER,
  )
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @LoggerParam(GetQuotationByConversionIdAndUserMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetQuotationByConversionIdAndUserRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetQuotationByConversionIdAndUserKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetQuotationByConversionIdAndUserRequest(message);

    // Create and call get quotation by conversion id and user controller.
    const controller = new GetQuotationByConversionIdAndUserController(
      logger,
      conversionRepository,
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
