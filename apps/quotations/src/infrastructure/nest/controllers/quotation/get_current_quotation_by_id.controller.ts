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
  QuotationRedisRepository,
} from '@zro/quotations/infrastructure';
import {
  GetCurrentQuotationByIdController,
  GetCurrentQuotationByIdRequest,
  GetCurrentQuotationByIdResponse,
} from '@zro/quotations/interface';

export type GetCurrentQuotationByIdKafkaRequest =
  KafkaMessage<GetCurrentQuotationByIdRequest>;

export type GetCurrentQuotationByIdKafkaResponse =
  KafkaResponse<GetCurrentQuotationByIdResponse>;

interface GetCurrentQuotationByIdConfig {
  APP_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;
}

/**
 * Get current quotation by id controller.
 */
@Controller()
@MicroserviceController()
export class GetCurrentQuotationByIdMicroserviceController {
  private readonly quotationCacheTTL: number;
  private readonly quotationRepository: QuotationRedisRepository;

  constructor(
    private readonly configService: ConfigService<GetCurrentQuotationByIdConfig>,
    private readonly redisService: RedisService,
  ) {
    this.quotationCacheTTL = Number(
      this.configService.get<number>(
        'APP_QUOTATIONS_CACHE_DEFAULT_TTL_MS',
        10000,
      ),
    );
    this.quotationRepository = new QuotationRedisRepository(
      this.redisService,
      this.quotationCacheTTL,
    );
  }

  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QUOTATION.GET_CURRENT_BY_ID)
  async execute(
    @LoggerParam(GetCurrentQuotationByIdMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCurrentQuotationByIdRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCurrentQuotationByIdKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCurrentQuotationByIdRequest(message);

    logger.debug('Get current quotation by id payload.', { payload });

    // Get current quotation by id controller.
    const controller = new GetCurrentQuotationByIdController(
      logger,
      this.quotationRepository,
    );

    const result = await controller.execute(payload);

    logger.debug('Got current quotation by id result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
