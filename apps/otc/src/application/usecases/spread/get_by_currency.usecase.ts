import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';

export class GetSpreadByCurrencyUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param spreadRepository Spread repository.
   */
  constructor(
    private logger: Logger,
    private readonly spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({ context: GetSpreadByCurrencyUseCase.name });
  }

  /**
   * Get the spread by currency.
   *
   * @param currency The spread currency
   * @returns Spread found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(currency: Currency): Promise<Spread> {
    // Data input check
    if (!currency?.symbol) {
      throw new MissingDataException(['Currency']);
    }

    // Search spread
    const spread = await this.spreadRepository.getByCurrency(currency);

    this.logger.debug('Spread found.', { spread });

    return spread;
  }
}
