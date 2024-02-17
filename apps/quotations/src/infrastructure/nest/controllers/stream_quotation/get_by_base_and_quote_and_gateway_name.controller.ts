import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  LoggerParam,
  MicroserviceController,
  RedisService,
} from '@zro/common';
import {
  KAFKA_TOPICS,
  StreamQuotationRedisRepository,
} from '@zro/quotations/infrastructure';
import {
  GetStreamQuotationByBaseAndQuoteAndGatewayNameController,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse,
} from '@zro/quotations/interface';

export type GetStreamQuotationByBaseAndQuoteAndGatewayNameKafkaRequest =
  KafkaMessage<GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest>;

export type GetStreamQuotationByBaseAndQuoteAndGatewayNameKafkaResponse =
  KafkaResponse<GetStreamQuotationByBaseAndQuoteAndGatewayNameResponse>;

export interface GetStreamQuotationByBaseAndQuoteAndGatewayNameConfig {
  APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;
}

/**
 * Get quotation controller.
 */
@Controller()
@MicroserviceController()
export class GetStreamQuotationByBaseAndQuoteAndGatewayNameMicroserviceController {
  private readonly streamQuotationCacheTTL: number;
  private readonly streamQuotationRepository: StreamQuotationRedisRepository;

  constructor(
    private readonly configService: ConfigService<GetStreamQuotationByBaseAndQuoteAndGatewayNameConfig>,
    private readonly redisService: RedisService,
  ) {
    this.streamQuotationCacheTTL = Number(
      this.configService.get<number>(
        'APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS',
        10000,
      ),
    );
    this.streamQuotationRepository = new StreamQuotationRedisRepository(
      this.redisService,
      this.streamQuotationCacheTTL,
    );
  }

  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(
    KAFKA_TOPICS.STREAM_QUOTATION.GET_BY_BASE_AND_QUOTE_AND_GATEWAY_NAME,
  )
  async execute(
    @LoggerParam(
      GetStreamQuotationByBaseAndQuoteAndGatewayNameMicroserviceController,
    )
    logger: Logger,
    @Payload('value')
    message: GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetStreamQuotationByBaseAndQuoteAndGatewayNameKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest(
      message,
    );

    logger.debug('Get quotation payload.', { payload });

    // Get quotation controller.
    const controller =
      new GetStreamQuotationByBaseAndQuoteAndGatewayNameController(
        logger,
        this.streamQuotationRepository,
      );

    const result = await controller.execute(payload);

    logger.debug('Got quotation result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
