import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { User } from '@zro/users/domain';
import { Currency } from '@zro/operations/domain';
import { Spread, SpreadRepository } from '@zro/otc/domain';

export class GetSpreadByUserAndCurrencyUseCase {
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
      context: GetSpreadByUserAndCurrencyUseCase.name,
    });
  }

  /**
   * Get the spread by currency and user.
   * If this user has no spread, the global spread is returned.
   *
   * @param user The spread user
   * @param currency The spread currency
   * @returns Spread found.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(user: User, currency: Currency): Promise<Spread> {
    // Data input check
    if (!user || !currency?.symbol) {
      throw new MissingDataException([
        ...(!user ? ['User'] : []),
        ...(!currency?.symbol ? ['Currency'] : []),
      ]);
    }

    // Search spread by user
    let spread = await this.spreadRepository.getByUserAndCurrency(
      user,
      currency,
    );

    if (!spread) {
      // Search global spread
      spread = await this.spreadRepository.getByCurrency(currency);
    }

    this.logger.debug('Spread found.', { spread });

    return spread;
  }
}
