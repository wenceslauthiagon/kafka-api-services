import { Logger } from 'winston';
import {
  StreamQuotationGateway,
  StreamQuotationGatewayRepository,
  StreamQuotationGatewayEntity,
  StreamPairRepository,
} from '@zro/quotations/domain';
import {
  GetStreamQuotationGateway,
  GetStreamQuotationGatewayRequest,
  OperationService,
} from '@zro/quotations/application';

/**
 * Create all stream quotation gateways.
 */
export class CreateStreamQuotationGatewayUseCase {
  constructor(
    private readonly logger: Logger,
    private readonly streamQuotationGatewayRepository: StreamQuotationGatewayRepository,
    private readonly streamPairRepository: StreamPairRepository,
    private readonly operationService: OperationService,
    private readonly streamQuotationGateway: GetStreamQuotationGateway,
  ) {
    this.logger = logger.child({
      context: CreateStreamQuotationGatewayUseCase.name,
      gatewayName: this.streamQuotationGateway.getProviderName(),
    });
  }

  async execute(): Promise<StreamQuotationGateway[]> {
    // Get all enabled stream pairs
    const streamPairs =
      await this.streamPairRepository.getByGatewayNameAndActiveIsTrue(
        this.streamQuotationGateway.getProviderName(),
      );

    if (!streamPairs.length) return [];

    const pairsQuoteCurrencySymbols = streamPairs.map(
      (pair) => pair.quoteCurrency.id,
    );

    // Get all active currencies
    const activeCurrecies =
      await this.operationService.getAllActiveCurrencies();

    // Get allowed quote currencies to gateway.
    const quoteCurrencies = activeCurrecies.filter((currency) =>
      pairsQuoteCurrencySymbols.includes(currency.id),
    );

    if (!quoteCurrencies.length) return [];

    this.streamQuotationGateway.setQuoteCurrencies(quoteCurrencies);

    // Get quotation from gateway
    const request: GetStreamQuotationGatewayRequest = {
      baseCurrencies: activeCurrecies,
    };
    const quotations = await this.streamQuotationGateway.getQuotation(request);

    // Set quotation metadata.
    const streamQuotations = quotations.map(
      (quotation) => new StreamQuotationGatewayEntity(quotation),
    );

    this.logger.debug('Quotations found.', { quotations: streamQuotations });

    // Store quotations on repository.
    await this.streamQuotationGatewayRepository.createOrUpdate(
      streamQuotations,
    );

    // WARNING: Do not send events here. This code will run every second!
    return streamQuotations;
  }
}
