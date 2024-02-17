import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  BankingTedEventEmitter,
  BankingTedNotFoundException,
  BankingTedInvalidStateException,
} from '@zro/banking/application';
import {
  BankingTed,
  BankingTedRepository,
  BankingTedState,
} from '@zro/banking/domain';

export class ForwardBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository bankingTed repository.
   * @param eventEmitter bankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: BankingTedRepository,
    private readonly eventEmitter: BankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: ForwardBankingTedUseCase.name,
    });
  }

  async execute(id: number): Promise<BankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search bankingTed
    const bankingTed = await this.repository.getById(id);

    this.logger.debug('Found bankingTed.', { bankingTed });

    if (!bankingTed) {
      throw new BankingTedNotFoundException({ id });
    }

    //Indepotent
    if (bankingTed.isAlreadyForwardedBankingTed()) {
      return bankingTed;
    }

    // Only CONFIRMED bankingTed is accept.
    if (bankingTed.state !== BankingTedState.CONFIRMED) {
      throw new BankingTedInvalidStateException(bankingTed);
    }

    this.logger.debug('Accepted bankingTed for confirmed bankingTed.', {
      bankingTed,
    });

    // bankingTed is forwarded.
    bankingTed.state = BankingTedState.FORWARDED;
    bankingTed.forwardedAt = new Date();

    // Update bankingTed
    await this.repository.update(bankingTed);

    // Fire Forwarded BankingTed
    this.eventEmitter.forwardedBankingTed(bankingTed);

    this.logger.debug('Updated bankingTed with forwarded status.', {
      bankingTed,
    });

    return bankingTed;
  }
}
