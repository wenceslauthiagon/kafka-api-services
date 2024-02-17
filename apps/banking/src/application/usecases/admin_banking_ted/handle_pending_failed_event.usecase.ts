import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  AdminBankingTedNotFoundException,
  AdminBankingTedEventEmitter,
} from '@zro/banking/application';

export class HandlePendingFailedAdminBankingTedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository AdminBankingTedRepository repository.
   * @param eventEmitter AdminBankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: AdminBankingTedRepository,
    private readonly eventEmitter: AdminBankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandlePendingFailedAdminBankingTedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an error is thrown.
   *
   * @param {String} id AdminBankingTed id.
   * @returns {AdminBankingTed} AdminBankingTed updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {AdminBankingTedNotFoundException} Thrown when adminBankingTed id was not found.
   */
  async execute(id: string): Promise<AdminBankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search AdminBankingTed
    const adminBankingTed = await this.repository.getById(id);

    this.logger.debug('Found AdminBankingTed.', { adminBankingTed });

    if (!adminBankingTed) {
      throw new AdminBankingTedNotFoundException({ id });
    }

    // Only PENDING adminBankingTed can go to FAILED state.
    if (adminBankingTed.state !== AdminBankingTedState.PENDING) {
      return adminBankingTed;
    }

    // Update adminBankingTed
    adminBankingTed.state = AdminBankingTedState.FAILED;
    adminBankingTed.failedAt = new Date();
    await this.repository.update(adminBankingTed);

    // Fire FailedAdminBankingTedEvent
    this.eventEmitter.failedAdminBankingTed(adminBankingTed);

    this.logger.debug('AdminBankingTed creation failed.', { adminBankingTed });

    return adminBankingTed;
  }
}
