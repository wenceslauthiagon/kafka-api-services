import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  AdminBankingTedEventEmitter,
  AdminBankingTedNotFoundException,
  AdminBankingTedInvalidStateException,
  AdminBankingTedInvalidConfirmationException,
  AdminBankingAccountNotActiveException,
} from '@zro/banking/application';
import {
  AdminBankingTed,
  AdminBankingTedState,
  AdminBankingTedEntity,
  AdminBankingTedRepository,
  AdminBankingAccountRepository,
} from '@zro/banking/domain';

export class ConfirmAdminBankingTedUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param adminBankingTedRepository adminBankingTed repository.
   * @param eventEmitter adminBankingTed event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly adminBankingTedRepository: AdminBankingTedRepository,
    private readonly adminBankingAccountRepository: AdminBankingAccountRepository,
    private readonly eventEmitter: AdminBankingTedEventEmitter,
  ) {
    this.logger = logger.child({
      context: ConfirmAdminBankingTedUseCase.name,
    });
  }

  async execute(payload: AdminBankingTedEntity): Promise<AdminBankingTed> {
    if (
      !payload?.transactionId ||
      !payload?.destination?.document ||
      !payload?.destination?.bankCode ||
      !payload?.destination?.branchNumber ||
      !payload?.destination?.accountNumber ||
      !payload?.destination?.accountType ||
      !payload?.value
    )
      throw new MissingDataException([
        ...(!payload?.transactionId ? ['Transaction ID'] : []),
        ...(!payload?.destination?.document ? ['Destination Document'] : []),
        ...(!payload?.destination?.bankCode ? ['Destination BankCode'] : []),
        ...(!payload?.destination?.branchNumber
          ? ['Destination Branch Number']
          : []),
        ...(!payload?.destination?.accountNumber
          ? ['Destination Account']
          : []),
        ...(!payload?.destination?.accountType
          ? ['Destination Account Type']
          : []),
        ...(!payload?.value ? ['Value'] : []),
      ]);

    // Search adminBankingTed
    const adminBankingTed =
      await this.adminBankingTedRepository.getByTransactionId(
        payload.transactionId,
      );

    this.logger.debug('Found adminBankingTed.', { adminBankingTed });

    if (!adminBankingTed) {
      throw new AdminBankingTedNotFoundException({
        transactionId: payload.transactionId,
      });
    }

    // Indepotent
    if (adminBankingTed.isAlreadyConfirmedAdminBankingTed()) {
      return adminBankingTed;
    }

    // Only WAITING adminBankingTed is accept.
    if (adminBankingTed.state !== AdminBankingTedState.WAITING) {
      throw new AdminBankingTedInvalidStateException(adminBankingTed);
    }

    // Search and validate destination
    const destinationFound = await this.adminBankingAccountRepository.getById(
      adminBankingTed.destination.id,
    );

    this.logger.debug('Found destination.', { destination: destinationFound });

    if (!destinationFound?.isActive()) {
      throw new AdminBankingAccountNotActiveException(destinationFound);
    }

    adminBankingTed.destination = destinationFound;

    this.validateTedInfo(adminBankingTed, payload);

    // adminBankingTed is confirmed.
    adminBankingTed.state = AdminBankingTedState.CONFIRMED;
    adminBankingTed.confirmedAt = new Date();

    // Update adminBankingTed
    await this.adminBankingTedRepository.update(adminBankingTed);

    // Fire Confirmed AdminBankingTed
    this.eventEmitter.confirmedAdminBankingTed(adminBankingTed);

    this.logger.debug('Updated adminBankingTed with confirmed status.', {
      adminBankingTed,
    });

    return adminBankingTed;
  }

  private validateTedInfo(
    adminBankingTedFound: AdminBankingTed,
    payload: AdminBankingTed,
  ) {
    this.logger.debug('Compare admin banking ted with payload.', {
      adminBankingTedFound,
      payload,
    });

    const accountNumber = `${adminBankingTedFound.destination.accountNumber}${adminBankingTedFound.destination.accountDigit}`;

    if (
      adminBankingTedFound.destination.document !==
        payload.destination.document ||
      String(adminBankingTedFound.destination.bankCode).padStart(3, '0') !==
        String(payload.destination.bankCode).padStart(3, '0') ||
      adminBankingTedFound.destination.branchNumber.padStart(4, '0') !==
        payload.destination.branchNumber.padStart(4, '0') ||
      accountNumber !== payload.destination.accountNumber ||
      adminBankingTedFound.destination.accountType.toLowerCase() !==
        payload.destination.accountType.toLowerCase() ||
      adminBankingTedFound.value !== payload.value
    ) {
      throw new AdminBankingTedInvalidConfirmationException({
        transactionId: payload.transactionId,
      });
    }
  }
}
