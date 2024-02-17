import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  AdminBankingTedEventEmitter,
  AdminBankingTedNotFoundException,
  AdminBankingTedInvalidStateException,
} from '@zro/banking/application';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';

export class ForwardAdminBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository adminBankingTed repository.
   * @param eventEmitter adminBankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: AdminBankingTedRepository,
    private readonly eventEmitter: AdminBankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: ForwardAdminBankingTedUseCase.name,
    });
  }

  async execute(id: string): Promise<AdminBankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search adminBankingTed
    const adminBankingTed = await this.repository.getById(id);

    this.logger.debug('Found adminBankingTed.', { adminBankingTed });

    if (!adminBankingTed) {
      throw new AdminBankingTedNotFoundException({ id });
    }

    //Indepotent
    if (adminBankingTed.isAlreadyForwardedAdminBankingTed()) {
      return adminBankingTed;
    }

    // Only CONFIRMED adminBankingTed is accept.
    if (adminBankingTed.state !== AdminBankingTedState.CONFIRMED) {
      throw new AdminBankingTedInvalidStateException(adminBankingTed);
    }

    // adminBankingTed is forwarded.
    adminBankingTed.state = AdminBankingTedState.FORWARDED;
    adminBankingTed.forwardedAt = new Date();

    // Update adminBankingTed
    await this.repository.update(adminBankingTed);

    // Fire Forwarded AdminBankingTed
    this.eventEmitter.forwardedAdminBankingTed(adminBankingTed);

    this.logger.debug('Updated adminBankingTed with forwarded status.', {
      adminBankingTed,
    });

    return adminBankingTed;
  }
}
