import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
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
  KAFKA_TOPICS,
  ConversionDatabaseRepository,
} from '@zro/otc/infrastructure';
import {
  GetConversionByOperationController,
  GetConversionByOperationRequest,
  GetConversionByOperationResponse,
} from '@zro/otc/interface';

export type GetConversionByOperationKafkaRequest =
  KafkaMessage<GetConversionByOperationRequest>;

export type GetConversionByOperationKafkaResponse =
  KafkaResponse<GetConversionByOperationResponse>;

/**
 * Conversion controller.
 */
@Controller()
@MicroserviceController()
export class GetConversionByOperationMicroserviceController {
  /**
   * Consumer of get conversion by operation.
   *
   * @param conversionRepository Conversion repository.
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CONVERSION.GET_BY_OPERATION)
  async execute(
    @RepositoryParam(ConversionDatabaseRepository)
    conversionRepository: ConversionRepository,
    @LoggerParam(GetConversionByOperationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetConversionByOperationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetConversionByOperationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetConversionByOperationRequest(message);

    logger.info('Get conversion by operation.', {
      payload,
    });

    // Create and call get conversion by user and id controller.
    const controller = new GetConversionByOperationController(
      logger,
      conversionRepository,
    );

    const conversion = await controller.execute(payload);

    logger.info('Conversion found.', { conversion });

    return {
      ctx,
      value: conversion,
    };
  }
}
