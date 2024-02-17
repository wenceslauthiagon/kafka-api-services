import { Logger } from 'winston';
import { Controller } from '@nestjs/common';
import { Ctx, KafkaContext, Payload } from '@nestjs/microservices';
import {
  CacheTTL,
  KafkaMessage,
  KafkaResponse,
  KafkaMessagePattern,
  KafkaServiceParam,
  LoggerParam,
  MicroserviceController,
} from '@zro/common';
import { HistoricalCryptoPriceGateway } from '@zro/otc/application';
import {
  GetCryptoPriceByCurrencyAndDateController,
  GetCryptoPriceByCurrencyAndDateRequest,
  GetCryptoPriceByCurrencyAndDateResponse,
} from '@zro/otc/interface';
import {
  MercadoBitcoinHistoricalCryptoPriceInterceptor,
  MercadoBitcoinHistoricalCryptoPriceParam,
} from '@zro/mercado-bitcoin/infrastructure';
import { KAFKA_TOPICS, QuotationServiceKafka } from '@zro/otc/infrastructure';

export type GetCryptoPriceByCurrencyAndDateKafkaRequest =
  KafkaMessage<GetCryptoPriceByCurrencyAndDateRequest>;

export type GetCryptoPriceByCurrencyAndDateKafkaResponse =
  KafkaResponse<GetCryptoPriceByCurrencyAndDateResponse>;

@Controller()
@CacheTTL()
@MicroserviceController([MercadoBitcoinHistoricalCryptoPriceInterceptor])
export class GetCryptoPriceByCurrencyAndDateMicroserviceController {
  /**
   * Consumer of get crypto price by currency symbol and date controller.
   *
   * @param logger Request logger.
   * @param message Request message.
   * @param storageService Storage Service instance which calls gateway.
   * @returns Response Kafka message.
   */
  @KafkaMessagePattern(KAFKA_TOPICS.CRYPTO.GET_PRICE_BY_CURRENCY_AND_DATE)
  async execute(
    @LoggerParam(GetCryptoPriceByCurrencyAndDateMicroserviceController)
    logger: Logger,
    @Payload('value') message: GetCryptoPriceByCurrencyAndDateRequest,
    @KafkaServiceParam(QuotationServiceKafka)
    quotationService: QuotationServiceKafka,
    @MercadoBitcoinHistoricalCryptoPriceParam()
    historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
    @Ctx() ctx: KafkaContext,
  ): Promise<GetCryptoPriceByCurrencyAndDateKafkaResponse> {
    logger.debug('Received message.', { value: message });

    // Parse kafka message.
    const payload = new GetCryptoPriceByCurrencyAndDateRequest(message);

    logger.info('Get crypto price by currency symbol and date.', { payload });

    // Create get controller.
    const controller = new GetCryptoPriceByCurrencyAndDateController(
      logger,
      quotationService,
      historicalCryptoPriceGateway,
    );

    // Get wallet invitation.
    const cryptoPrice = await controller.execute(payload);

    logger.info('Crypto price found.', { cryptoPrice });

    return {
      ctx,
      value: cryptoPrice,
    };
  }
}
