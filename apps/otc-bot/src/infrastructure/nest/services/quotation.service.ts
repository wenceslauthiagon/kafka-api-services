import { Logger } from 'winston';
import { KafkaService } from '@zro/common';
import { Tax, TaxEntity } from '@zro/quotations/domain';
import {
  QuotationService,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceRequest,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceResponse,
  GetStreamPairByIdServiceRequest,
  GetStreamPairByIdServiceResponse,
} from '@zro/otc-bot/application';
import {
  GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest,
  GetStreamPairByIdRequest,
  GetAllTaxRequest,
  GetAllTaxRequestSort,
} from '@zro/quotations/interface';
import {
  GetAllTaxServiceKafka,
  GetStreamPairByIdServiceKafka,
  GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka,
} from '@zro/quotations/infrastructure';

/**
 * Quotation microservice
 */
export class QuotationServiceKafka implements QuotationService {
  static _services: any[] = [
    GetAllTaxServiceKafka,
    GetStreamPairByIdServiceKafka,
    GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka,
  ];

  private readonly getStreamQuotationByBaseAndQuoteAndGatewayNameService: GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka;
  private readonly getStreamPairByIdService: GetStreamPairByIdServiceKafka;
  private readonly getAllTaxService: GetAllTaxServiceKafka;

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
    this.logger = logger.child({ context: QuotationServiceKafka.name });

    this.getStreamQuotationByBaseAndQuoteAndGatewayNameService =
      new GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceKafka(
        this.requestId,
        this.logger,
        this.kafkaService,
      );

    this.getStreamPairByIdService = new GetStreamPairByIdServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );

    this.getAllTaxService = new GetAllTaxServiceKafka(
      this.requestId,
      this.logger,
      this.kafkaService,
    );
  }
  /**
   * Get stream quotation from a pair of a provider
   */
  async getStreamQuotationByBaseAndQuoteAndGatewayName(
    request: GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceRequest,
  ): Promise<GetStreamQuotationByBaseAndQuoteAndGatewayNameServiceResponse> {
    const remote = new GetStreamQuotationByBaseAndQuoteAndGatewayNameRequest({
      baseCurrencySymbol: request.baseCurrency.symbol,
      quoteCurrencySymbol: request.quoteCurrency.symbol,
      gatewayName: request.gatewayName,
    });

    const response =
      await this.getStreamQuotationByBaseAndQuoteAndGatewayNameService.execute(
        remote,
      );

    if (!response) return null;

    return {
      id: response.id,
      baseCurrency: response.baseCurrency,
      quoteCurrency: response.quoteCurrency,
      buy: response.buy,
      sell: response.sell,
      amount: response.amount,
      gatewayName: response.gatewayName,
      timestamp: response.timestamp,
      composedBy: response.composedBy,
      streamPair: response.streamPair,
    };
  }

  async getStreamPairById(
    request: GetStreamPairByIdServiceRequest,
  ): Promise<GetStreamPairByIdServiceResponse> {
    const remote = new GetStreamPairByIdRequest({
      id: request.id,
    });

    const response = await this.getStreamPairByIdService.execute(remote);

    if (!response) return null;

    return {
      id: response.id,
      baseCurrency: response.baseCurrency,
      quoteCurrency: response.quoteCurrency,
      priority: response.priority,
      gatewayName: response.gatewayName,
      active: response.active,
      composedBy: response.composedBy,
    };
  }

  async getTaxByName(name: string): Promise<Tax> {
    const payload = new GetAllTaxRequest({
      // TODO: it's possible to have many taxes with the same name,
      // so check what to do with this.
      name,
      sort: GetAllTaxRequestSort.ID,
      page: 1,
      pageSize: 1,
    });

    const response = await this.getAllTaxService.execute(payload);

    if (!response.data?.length) return null;

    const [result] = response.data;

    // Get only the first tax
    const tax = new TaxEntity({
      id: result.id,
      name: result.name,
      value: result.value,
      format: result.format,
      createdAt: result.createdAt,
    });

    return tax;
  }
}
