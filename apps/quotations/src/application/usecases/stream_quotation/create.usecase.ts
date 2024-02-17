import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import {
  StreamPair,
  StreamQuotationGatewayRepository,
  StreamQuotation,
  StreamQuotationRepository,
  StreamQuotationEntity,
  StreamPairRepository,
} from '@zro/quotations/domain';
import {
  OperationService,
  StreamQuotationEventEmitter,
} from '@zro/quotations/application';

/**
 * Create all stream quotations based on stream quotation gateways and stream
 * pairs. Created stream quotations are stored in repository.
 */
export class CreateStreamQuotationUseCase {
  constructor(
    private logger: Logger,
    private readonly streamQuotationGatewayRepository: StreamQuotationGatewayRepository,
    private readonly streamQuotationRepository: StreamQuotationRepository,
    private readonly streamPairRepository: StreamPairRepository,
    private readonly operationService: OperationService,
    private readonly eventEmitter: StreamQuotationEventEmitter,
  ) {
    this.logger = logger.child({ context: CreateStreamQuotationUseCase.name });
  }

  async execute(): Promise<StreamQuotation[]> {
    this.logger.debug('Creating synthetic quotations.');

    // Get all enabled stream pairs
    const streamPairs = await this.streamPairRepository.getAllActiveIsTrue();
    if (!streamPairs.length) return [];

    // Get all active currencies
    const activeCurrencies =
      await this.operationService.getAllActiveCurrencies();
    if (!activeCurrencies.length) return [];

    // Check for if all currencies are also active.
    const activePairs = streamPairs
      .map((pair) => {
        pair.baseCurrency = activeCurrencies.find(
          (currency) => currency.id === pair.baseCurrency.id,
        );
        pair.quoteCurrency = activeCurrencies.find(
          (currency) => currency.id === pair.quoteCurrency.id,
        );
        return pair;
      })
      .filter(
        (pair) =>
          pair.baseCurrency?.isActive() && pair.quoteCurrency?.isActive(),
      );
    if (!activePairs.length) return [];

    // Start processing natural pairs.
    const naturalPairs = activePairs.filter(
      (streamPair) => !streamPair?.isSynthetic(),
    );
    if (!naturalPairs.length) return [];

    // Build natural quotations first because we need it to build synthetic
    // quotations.
    const naturalQuotations = await Promise.all(
      naturalPairs.map((streamPair) =>
        this.buildNaturalStreamQuotation(streamPair),
      ),
    ).then((quotations) => quotations.filter((i) => i));

    // Get all synthetic pairs
    const syntheticPairs = activePairs.filter(
      (streamPair) => streamPair?.isSynthetic(),
    );
    if (!syntheticPairs.length) return [];

    // Build synthetic quotations.
    const syntheticQuotations = syntheticPairs
      .map((streamPair) =>
        this.buildSyntheticPair(streamPair, naturalQuotations, streamPairs),
      )
      .filter((streamPair) => streamPair);

    const streamQuotations = [...naturalQuotations, ...syntheticQuotations];
    if (!streamQuotations.length) return [];

    // Store all collected quotations
    await this.streamQuotationRepository.createOrUpdate(streamQuotations);

    this.eventEmitter.createStreamQuotation(streamQuotations);

    return streamQuotations;
  }

  /**
   * Create a natural stream quotation. Natural stream quotation came from a
   * natural stream pair.
   *
   * @param streamPair Natural stream pair.
   * @returns Natural stream quotation or null if not found.
   */
  private async buildNaturalStreamQuotation(
    streamPair: StreamPair,
  ): Promise<StreamQuotation> {
    const { baseCurrency, quoteCurrency, gatewayName } = streamPair;

    // Search this pair in quotations created by gateways.
    const streamQuotationGateway =
      await this.streamQuotationGatewayRepository.getByBaseCurrencyAndQuoteCurrencyAndGatewayName(
        baseCurrency,
        quoteCurrency,
        gatewayName,
      );

    // Quotation was not found?
    if (!streamQuotationGateway) return null;

    // Create a new natural stream quotation.
    return new StreamQuotationEntity({
      id: uuidV4(),
      baseCurrency,
      quoteCurrency,
      buy: streamQuotationGateway.buy,
      sell: streamQuotationGateway.sell,
      amount: streamQuotationGateway.amount,
      gatewayName,
      composedBy: null,
      timestamp: new Date(),
      streamPair,
    });
  }

  /**
   * Create a synthetic stream quotation. Natural stream quotation came from a
   * synthetic stream pair.
   *
   * @param streamPair Synthetic stream pair.
   * @param naturalQuotations Natural stream quotations.
   * @param allStreamPairs All stream pairs found.
   * @returns Synthetic stream quotation or null if not found.
   */
  private buildSyntheticPair(
    streamPair: StreamPair,
    naturalQuotations: StreamQuotation[],
    allStreamPairs: StreamPair[],
  ): StreamQuotation {
    // Sanity check!
    if (!streamPair?.isSynthetic()) return null;

    // Lazy load composedBy pairs.
    const composedByPairs = streamPair.composedBy
      ?.map((pair) => allStreamPairs.find((item) => item.id === pair.id))
      // Sanity check. Synthetic pair composition is not allowed.
      .filter((pair) => pair && !pair.isSynthetic());

    // Go away if there is not enough pairs to build composed quotation
    if (composedByPairs.length !== streamPair.composedBy?.length) {
      this.logger.warn('Composition not found.', { streamPair });
      return null;
    }

    // Update composition reference
    streamPair.composedBy = composedByPairs;

    const composedByPairsIds = composedByPairs.map(
      (streamPair) => streamPair.id,
    );

    // Get natural quotations related to composition pairs found.
    const composedByQuotations = naturalQuotations.filter((quotation) =>
      composedByPairsIds.includes(quotation.streamPair.id),
    );

    // Go away if there is not enough natural quotations to build composed quotation
    if (composedByQuotations.length !== streamPair.composedBy?.length) {
      return null;
    }

    const { baseCurrency, quoteCurrency, gatewayName } = streamPair;

    // Build composed quotation.
    return composedByQuotations.reduce(
      (acc, cur) => {
        acc.buy *= cur.buy;
        acc.sell *= cur.sell;
        acc.composedBy.push(cur);
        return acc;
      },
      new StreamQuotationEntity({
        id: uuidV4(),
        baseCurrency,
        quoteCurrency,
        buy: 1,
        sell: 1,
        amount: 1, // FIXME: Deveria vir do pair
        gatewayName,
        composedBy: [],
        timestamp: new Date(),
        streamPair,
      }),
    );
  }
}
