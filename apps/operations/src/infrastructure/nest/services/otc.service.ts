import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { User } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  Receipt,
  ReceiptEntity,
} from '@zro/operations/domain';
import { Conversion, ConversionEntity } from '@zro/otc/domain';
import { QuotationEntity } from '@zro/quotations/domain';
import { OtcService } from '@zro/operations/application';
import {
  GetConversionByOperationServiceKafka,
  GetCryptoPriceByCurrencyAndDateServiceKafka,
  GetConversionReceiptByUserAndOperationServiceKafka,
} from '@zro/otc/infrastructure';
import {
  GetConversionReceiptByUserAndOperationRequest,
  GetConversionByOperationRequest,
} from '@zro/otc/interface';

/**
 * Otc microservice
 */
export class OtcServiceKafka implements OtcService {
  static _services: any[] = [
    GetConversionReceiptByUserAndOperationServiceKafka,
    GetConversionByOperationServiceKafka,
    GetCryptoPriceByCurrencyAndDateServiceKafka,
  ];

  private readonly getReceiptByUserAndOperationService: GetConversionReceiptByUserAndOperationServiceKafka;
  private readonly getConversionByOperationService: GetConversionByOperationServiceKafka;
  private readonly getCryptoPriceByCurrencyAndDateService: GetCryptoPriceByCurrencyAndDateServiceKafka;

  /**
   * Default constructor.
   * @param requestId The request id.
   * @param logger Global logger.
   * @param kafkaService Service to access Kafka.
   */
  constructor(
    private requestId: string,
    private logger: Logger,
    private kafkaService: KafkaService,
  ) {
    this.logger = logger.child({ context: OtcServiceKafka.name });

    this.getReceiptByUserAndOperationService =
      new GetConversionReceiptByUserAndOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getConversionByOperationService =
      new GetConversionByOperationServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getCryptoPriceByCurrencyAndDateService =
      new GetCryptoPriceByCurrencyAndDateServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );
  }

  /**
   * Get conversion receipt by user, operation and currency.
   * @param user User.
   * @param operation Operation.
   * @param currency Currency.
   * @returns Receipt of conversion.
   */
  async getOtcReceipt(
    user: User,
    operation: Operation,
    currency: Currency,
  ): Promise<Receipt> {
    const remote = new GetConversionReceiptByUserAndOperationRequest({
      userId: user.uuid,
      operationId: operation.id,
      currencyId: currency.id,
      currencyTitle: currency.title,
      currencyTag: currency.tag,
      currencySymbol: currency.symbol,
      currencyDecimal: currency.decimal,
    });

    const response =
      await this.getReceiptByUserAndOperationService.execute(remote);

    return response && new ReceiptEntity(response);
  }

  /**
   * Get conversion by operation.
   * @param operation Operation.
   * @returns Conversion.
   */
  async getConversionByOperation(operation: Operation): Promise<Conversion> {
    const remote = new GetConversionByOperationRequest({
      operationId: operation.id,
    });

    const response = await this.getConversionByOperationService.execute(remote);

    if (!response) return null;

    const conversion = new ConversionEntity({
      id: response.id,
      operation: new OperationEntity({ id: response.operationId }),
      currency: new CurrencyEntity({ id: response.currencyId }),
      quotation: new QuotationEntity({ id: response.quotationId }),
      conversionType: response.conversionType,
      amount: response.amount,
      quote: response.quote,
      usdAmount: response.usdAmount,
      usdQuote: response.usdQuote,
      createdAt: response.createdAt,
    });

    return conversion;
  }

  /**
   * Get crypto price by currency and date.
   * @param currency Currency.
   * @param date Date.
   * @returns Price.
   */
  async getCryptoPriceByCurrencyAndDate(
    currency: Currency,
    date: Date,
  ): Promise<number> {
    const response = await this.getCryptoPriceByCurrencyAndDateService.execute({
      currencySymbol: currency.symbol,
      date,
    });

    if (!response) return null;

    return response.estimatedPrice;
  }
}
