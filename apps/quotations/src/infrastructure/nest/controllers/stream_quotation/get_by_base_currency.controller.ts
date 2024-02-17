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
  MissingEnvVarException,
  RedisService,
} from '@zro/common';
import {
  KAFKA_TOPICS,
  StreamQuotationRedisRepository,
} from '@zro/quotations/infrastructure';
import {
  GetStreamQuotationByBaseCurrencyController,
  GetStreamQuotationByBaseCurrencyRequest,
  GetStreamQuotationByBaseCurrencyResponse,
} from '@zro/quotations/interface';

export type GetStreamQuotationByBaseCurrencyKafkaRequest =
  KafkaMessage<GetStreamQuotationByBaseCurrencyRequest>;

export type GetStreamQuotationByBaseCurrencyKafkaResponse =
  KafkaResponse<GetStreamQuotationByBaseCurrencyResponse>;

export interface GetStreamQuotationByBaseCurrencyConfig {
  APP_OPERATION_CURRENCY_SYMBOL: string;
  APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;
}

/**
 * Get quotation controller.
 */
@Controller()
@MicroserviceController()
export class GetStreamQuotationByBaseCurrencyMicroserviceController {
  private readonly streamQuotationCacheTTL: number;
  private readonly operationCurrencySymbol: string;
  private readonly streamQuotationRepository: StreamQuotationRedisRepository;

  constructor(
    private readonly configService: ConfigService<GetStreamQuotationByBaseCurrencyConfig>,
    private readonly redisService: RedisService,
  ) {
    this.operationCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_SYMBOL',
    );

    if (!this.operationCurrencySymbol) {
      throw new MissingEnvVarException(['APP_OPERATION_CURRENCY_SYMBOL']);
    }

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
  @KafkaMessagePattern(KAFKA_TOPICS.STREAM_QUOTATION.GET_BY_BASE_CURRENCY)
  async execute(
    @LoggerParam(GetStreamQuotationByBaseCurrencyMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetStreamQuotationByBaseCurrencyRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetStreamQuotationByBaseCurrencyKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetStreamQuotationByBaseCurrencyRequest(message);

    logger.debug('Get quotation payload.', { payload });

    // Get quotation controller.
    const controller = new GetStreamQuotationByBaseCurrencyController(
      logger,
      this.streamQuotationRepository,
      this.operationCurrencySymbol,
    );

    const result = await controller.execute(payload);

    logger.debug('Got quotation result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
