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

export class RejectAdminBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param adminBankingTedRepository adminBankingTed repository.
   * @param eventEmitter adminBankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly adminBankingTedRepository: AdminBankingTedRepository,
    private readonly eventEmitter: AdminBankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: RejectAdminBankingTedUseCase.name,
    });
  }

  async execute(
    id: string,
    code?: string,
    message?: string,
  ): Promise<AdminBankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['Transaction ID']);
    }

    // Search adminBankingTed
    const adminBankingTed = await this.adminBankingTedRepository.getById(id);

    this.logger.debug('Found adminBankingTed.', { adminBankingTed });

    if (!adminBankingTed) {
      throw new AdminBankingTedNotFoundException({ id });
    }

    // Indepotent
    if (adminBankingTed.isAlreadyFailedAdminBankingTed()) {
      return adminBankingTed;
    }

    // CONFIRMED and FORWARDED state is accept.
    if (
      ![
        AdminBankingTedState.CONFIRMED,
        AdminBankingTedState.FORWARDED,
      ].includes(adminBankingTed.state)
    ) {
      throw new AdminBankingTedInvalidStateException(adminBankingTed);
    }

    // adminBankingTed is failed.
    adminBankingTed.state = AdminBankingTedState.FAILED;
    adminBankingTed.failureCode = code;
    adminBankingTed.failureMessage = message;
    adminBankingTed.failedAt = new Date();

    // Update adminBankingTed
    await this.adminBankingTedRepository.update(adminBankingTed);

    // Fire Failed AdminBankingTed
    this.eventEmitter.failedAdminBankingTed(adminBankingTed);

    this.logger.debug('Updated adminBankingTed with failed status.', {
      adminBankingTed,
    });

    return adminBankingTed;
  }
}
