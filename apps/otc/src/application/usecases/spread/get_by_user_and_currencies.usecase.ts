import { Logger } from 'winston';
import { isArray } from 'class-validator';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';

export class GetSpreadsByUserAndCurrenciesUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param spreadRepository Spread repository.
   */
  constructor(
    private logger: Logger,
    private readonly spreadRepository: SpreadRepository,
  ) {
    this.logger = logger.child({
      context: GetSpreadsByUserAndCurrenciesUseCase.name,
    });
  }

  /**
   * Get the spread by currencies and user.
   * If this user has no spread, the global spread is returned.
   *
   * @param user The spread user
   * @param currencies The spread currencies
   * @returns Spread found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User, currencies: Currency[]): Promise<Spread[]> {
    // Data input check
    if (!user?.uuid || !isArray(currencies)) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!isArray(currencies) ? ['Currencies'] : []),
      ]);
    }

    const spreads = await Promise.all(
      currencies.map(async (currency) => {
        // Search spread by user
        let spread = await this.spreadRepository.getByUserAndCurrency(
          user,
          currency,
        );

        if (!spread) {
          // Search global spread
          spread = await this.spreadRepository.getByCurrency(currency);
        }

        return spread;
      }),
    );

    // Clear the nullable values
    const result = spreads.filter((i) => i);

    this.logger.debug('Spreads found.', { result });

    return result;
  }
}
