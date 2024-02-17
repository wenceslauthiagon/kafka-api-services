import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedRepository,
  AdminBankingTedState,
  PurposeCode,
  AdminBankingAccountRepository,
} from '@zro/banking/domain';
import {
  BankingTedGateway,
  CreateBankingTedPspRequest,
  AdminBankingAccountNotActiveException,
  AdminBankingTedNotFoundException,
  AdminBankingTedInvalidStateException,
  AdminBankingTedEventEmitter,
} from '@zro/banking/application';

export class HandlePendingAdminBankingTedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger.
   * @param adminBankingTedRepository AdminBankingTed repository.
   * @param adminBankingAccountRepository AdminBankingAccount repository.
   * @param eventEmitter AdminBankingTed event emitter.
   * @param eventEmitter AdminBankingTed Emitter.
   * @param pspGateway PSP gateway.
   * @param adminBankingTedCallbackUrl Callback ETF notify.
   */
  constructor(
    private logger: Logger,
    private readonly adminBankingTedRepository: AdminBankingTedRepository,
    private readonly adminBankingAccountRepository: AdminBankingAccountRepository,
    private readonly pspGateway: BankingTedGateway,
    private readonly eventEmitter: AdminBankingTedEventEmitter,
    private readonly adminBankingTedCallbackUrl: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingAdminBankingTedEventUseCase.name,
    });
  }

  /**
   * Handler triggered when adminBankingTed is pending.
   *
   * @param id adminBankingTed id.
   * @returns AdminBankingTed created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {AdminBankingTedInvalidStateException} Thrown when adminBankingTed state is not pending.
   * @throws {AdminBankingAccountNotActiveException} Thrown when admin banking account not active.
   */
  async execute(id: string): Promise<AdminBankingTed> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search adminBankingTed
    const adminBankingTed = await this.adminBankingTedRepository.getById(id);

    this.logger.debug('Found admin banking TED.', { ted: adminBankingTed });

    if (!adminBankingTed) {
      throw new AdminBankingTedNotFoundException({ id });
    }

    // Check indepotent
    if (adminBankingTed.isAlreadyPaidAdminBankingTed()) {
      return adminBankingTed;
    }

    // Only PENDING adminBankingTed is accept.
    if (adminBankingTed.state !== AdminBankingTedState.PENDING) {
      throw new AdminBankingTedInvalidStateException(adminBankingTed);
    }

    // Search and validate source
    const sourceFound = await this.adminBankingAccountRepository.getById(
      adminBankingTed.source.id,
    );

    this.logger.debug('Found source.', { source: sourceFound });

    if (!sourceFound?.isActive()) {
      throw new AdminBankingAccountNotActiveException(sourceFound);
    }

    Object.assign(adminBankingTed.source, sourceFound);

    // Search and validate destination
    const destinationFound = await this.adminBankingAccountRepository.getById(
      adminBankingTed.destination.id,
    );

    this.logger.debug('Found destination.', { destination: destinationFound });

    if (!destinationFound?.isActive()) {
      throw new AdminBankingAccountNotActiveException(destinationFound);
    }

    Object.assign(adminBankingTed.destination, destinationFound);

    const transactionId = uuidV4();
    const body: CreateBankingTedPspRequest = {
      transactionId,
      ownerDocument: adminBankingTed.source.document,
      ownerName: adminBankingTed.source.fullName,
      ownerAccount: adminBankingTed.source.accountNumber,
      beneficiaryDocument: adminBankingTed.destination.document,
      beneficiaryName: adminBankingTed.destination.fullName,
      beneficiaryBankCode: adminBankingTed.destination.bankCode,
      beneficiaryAgency: adminBankingTed.destination.branchNumber,
      beneficiaryAccount: adminBankingTed.destination.accountNumber,
      beneficiaryAccountDigit: adminBankingTed.destination.accountDigit,
      beneficiaryAccountType: adminBankingTed.destination.accountType,
      amount: adminBankingTed.value,
      purposeCode: PurposeCode.TED_10,
      callbackUrl: `${this.adminBankingTedCallbackUrl}/${transactionId}`,
    };

    const pspResult = await this.pspGateway.createBankingTed(body);

    this.logger.debug('Admin banking TED sent to pspGateway', { pspResult });

    // AdminBankingTed is waiting.
    adminBankingTed.transactionId = transactionId;
    adminBankingTed.state = AdminBankingTedState.WAITING;

    // Update adminBankingTed
    await this.adminBankingTedRepository.update(adminBankingTed);

    // Fire waitingAdminBankingTed
    this.eventEmitter.waitingAdminBankingTed(adminBankingTed);

    this.logger.debug('Updated admin banking TED with waiting status.', {
      adminBankingTed,
    });

    return adminBankingTed;
  }
}
