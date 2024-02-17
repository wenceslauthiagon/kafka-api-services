import { Controller } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Payload, KafkaContext, Ctx } from '@nestjs/microservices';
import { Logger } from 'winston';
import {
  KafkaMessage,
  KafkaMessagePattern,
  KafkaResponse,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
  MissingEnvVarException,
  RedisService,
  RepositoryParam,
} from '@zro/common';
import { HolidayRepository } from '@zro/quotations/domain';
import { OtcService } from '@zro/quotations/application';
import {
  HolidayDatabaseRepository,
  KAFKA_TOPICS,
  OtcServiceKafka,
  QuotationRedisRepository,
  StreamPairRedisRepository,
  StreamQuotationRedisRepository,
  TaxRedisRepository,
} from '@zro/quotations/infrastructure';
import {
  GetQuotationController,
  GetQuotationRequest,
  GetQuotationResponse,
} from '@zro/quotations/interface';

export type GetQuotationKafkaRequest = KafkaMessage<GetQuotationRequest>;

export type GetQuotationKafkaResponse = KafkaResponse<GetQuotationResponse>;

export interface GetQuotationConfig {
  APP_OTC_IOF_NAME: string;
  APP_OPERATION_CURRENCY_SYMBOL: string;
  APP_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;
  APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS: number;
}

/**
 * Get quotation controller.
 */
@Controller()
@MicroserviceController()
export class GetQuotationMicroserviceController {
  private readonly quotationCacheTTL: number;
  private readonly streamQuotationCacheTTL: number;
  private readonly operationCurrencySymbol: string;
  private readonly otcTaxIofName: string;
  private readonly streamPairRepository: StreamPairRedisRepository;
  private readonly streamQuotationRepository: StreamQuotationRedisRepository;
  private readonly quotationRepository: QuotationRedisRepository;
  private readonly taxRepository: TaxRedisRepository;

  constructor(
    private readonly configService: ConfigService<GetQuotationConfig>,
    private readonly redisService: RedisService,
  ) {
    this.operationCurrencySymbol = this.configService.get<string>(
      'APP_OPERATION_CURRENCY_SYMBOL',
    );
    this.otcTaxIofName = this.configService.get<string>('APP_OTC_IOF_NAME');

    if (!this.operationCurrencySymbol || !this.otcTaxIofName) {
      throw new MissingEnvVarException([
        ...(!this.operationCurrencySymbol
          ? ['APP_OPERATION_CURRENCY_SYMBOL']
          : []),
        ...(!this.otcTaxIofName ? ['APP_OTC_IOF_NAME'] : []),
      ]);
    }

    this.quotationCacheTTL = Number(
      this.configService.get<number>(
        'APP_QUOTATIONS_CACHE_DEFAULT_TTL_MS',
        10000,
      ),
    );
    this.streamQuotationCacheTTL = Number(
      this.configService.get<number>(
        'APP_STREAM_QUOTATIONS_CACHE_DEFAULT_TTL_MS',
        10000,
      ),
    );
    this.streamPairRepository = new StreamPairRedisRepository(
      this.redisService,
    );
    this.streamQuotationRepository = new StreamQuotationRedisRepository(
      this.redisService,
      this.streamQuotationCacheTTL,
    );
    this.quotationRepository = new QuotationRedisRepository(
      this.redisService,
      this.quotationCacheTTL,
    );
    this.taxRepository = new TaxRedisRepository(this.redisService);
  }

  /**
   * @param logger Request logger.
   * @param message Request Kafka message.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.QUOTATION.GET_CURRENT)
  async execute(
    @RepositoryParam(HolidayDatabaseRepository)
    holidayRepository: HolidayRepository,
    @KafkaServiceParam(OtcServiceKafka)
    otcService: OtcService,
    @LoggerParam(GetQuotationMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetQuotationRequest,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetQuotationKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetQuotationRequest(message);

    logger.debug('Get quotation payload.', { payload });

    // Get quotation controller.
    const controller = new GetQuotationController(
      logger,
      this.streamPairRepository,
      this.streamQuotationRepository,
      this.quotationRepository,
      this.taxRepository,
      holidayRepository,
      otcService,
      this.operationCurrencySymbol,
      this.otcTaxIofName,
      this.quotationCacheTTL,
    );

    const result = await controller.execute(payload);

    logger.debug('Got quotation result.', { result });

    return {
      ctx,
      value: result,
    };
  }
}
