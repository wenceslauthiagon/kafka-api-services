import { Logger } from 'winston';
import {
  MissingDataException,
  isCnpj,
  isCpf,
  ForbiddenException,
} from '@zro/common';
import { PersonType, User } from '@zro/users/domain';
import {
  DecodedPixAccount,
  DecodedPixAccountRepository,
  AccountType,
  DecodedPixAccountState,
  DecodedPixAccountEntity,
} from '@zro/pix-payments/domain';
import { Bank } from '@zro/banking/domain';
import {
  KycGateway,
  UserService,
  BankingService,
  KYCNotFoundException,
  BankNotFoundException,
  DecodedPixAccountEventEmitter,
  DecodedPixAccountOwnedByUserException,
  MaxDecodedPixAccountRequestsPerDayReached,
  DecodedPixAccountDocumentAndPersonTypeConflictException,
} from '@zro/pix-payments/application';

export class CreateDecodedPixAccountUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository Decode by account repository.
   * @param eventEmitter Decode by account event emitter.
   * @param bankingService Banking service gateway.
   * @param userService User service gateway.
   * @param maxPerDay Decode by account daily max number.
   * @param kycGateway KYC gateway.
   */
  constructor(
    private logger: Logger,
    private readonly repository: DecodedPixAccountRepository,
    private readonly eventEmitter: DecodedPixAccountEventEmitter,
    private readonly bankingService: BankingService,
    private readonly userService: UserService,
    private readonly maxPerDay: number,
    private readonly kycGateway: KycGateway,
    private readonly pixPaymentZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: CreateDecodedPixAccountUseCase.name,
    });
  }

  /**
   * Decode by Account.
   *
   * @param id Decode by Account request id.
   * @param user Decode request owner.
   * @param personType Person type (Natural ou Legal).
   * @param bank Bank.
   * @param branch Branch.
   * @param accountNumber Account number .
   * @param accountType Account type (CACC, SLRY or SLRY).
   * @param document CPF or CNPJ number.
   * @returns Decoded Account created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    user: User,
    personType: PersonType,
    bank: Bank,
    branch: string,
    accountNumber: string,
    accountType: AccountType,
    document: string,
  ): Promise<DecodedPixAccount> {
    // Data input check
    if (
      !id ||
      !user ||
      !branch ||
      !bank ||
      !document ||
      !personType ||
      !accountType ||
      !accountNumber
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!user ? ['User'] : []),
        ...(!personType ? ['Person Type'] : []),
        ...(!bank ? ['Bank'] : []),
        ...(!branch ? ['Branch'] : []),
        ...(!accountNumber ? ['Account Number'] : []),
        ...(!accountType ? ['Account Type'] : []),
        ...(!document ? ['Document'] : []),
      ]);
    }

    if (
      (personType === PersonType.NATURAL_PERSON && !isCpf(document)) ||
      (personType === PersonType.LEGAL_PERSON && !isCnpj(document))
    ) {
      throw new DecodedPixAccountDocumentAndPersonTypeConflictException({
        document,
        personType,
      });
    }

    const pixDecodedAccount = new DecodedPixAccountEntity({
      id,
      user,
      name: '',
      state: DecodedPixAccountState.PENDING,
      personType,
      bank,
      branch,
      accountNumber,
      accountType,
      document,
    });

    // Get already decoded by account using id
    const alreadyDecoded = await this.repository.getById(id);
    this.logger.debug('Decode by Account found (search by id).', {
      decodedAccount: alreadyDecoded,
    });

    // Test if already exist a previous decoded asked by user
    if (alreadyDecoded) {
      if (alreadyDecoded.user.uuid === user.uuid) {
        return alreadyDecoded;
      } else {
        throw new ForbiddenException();
      }
    }

    // Get bank by ISPB
    const foundBank = await this.bankingService.getBankByIspb(bank.ispb);

    this.logger.debug('Bank found.', { foundBank });

    if (!foundBank) {
      throw new BankNotFoundException(bank);
    }

    pixDecodedAccount.bank = foundBank;

    // Test the maximum number of daily decoding requests has been reached
    const unusedDecodes =
      await this.repository.countByUserAndStatePendingLast24Hours(user);

    this.logger.debug('Number of daily decode requests.', {
      requestsToday: unusedDecodes,
    });

    if (unusedDecodes >= this.maxPerDay) {
      throw new MaxDecodedPixAccountRequestsPerDayReached(
        this.maxPerDay,
        pixDecodedAccount,
      );
    }

    const previouslyDecoded =
      await this.repository.getByDocumentAndAccountAndBranch(
        document,
        accountNumber,
        branch,
      );
    this.logger.debug('Previously Decoded  Account found.', {
      previouslyDecoded,
    });

    if (previouslyDecoded) {
      pixDecodedAccount.name = previouslyDecoded.name;
      pixDecodedAccount.tradeName = previouslyDecoded.tradeName;
      pixDecodedAccount.props = previouslyDecoded.props;

      return this.storeAccount(pixDecodedAccount);
    }

    if (personType === PersonType.NATURAL_PERSON) {
      // Check if third party is Zro client
      const onboarding =
        await this.userService.getOnboardingByCpfAndStatusIsFinished({
          document: document,
        });

      this.logger.debug('Found user onboarding.', {
        onboarding,
      });

      if (onboarding) {
        // Can't decode self account
        // Fixme: change WalletAccount to use User entity
        if (
          onboarding.user.uuid === user.uuid &&
          bank.ispb === this.pixPaymentZroBankIspb
        ) {
          throw new DecodedPixAccountOwnedByUserException(pixDecodedAccount);
        }

        pixDecodedAccount.name = onboarding.fullName;

        return this.storeAccount(pixDecodedAccount);
      }
    }

    const getKYC = await this.kycGateway.getKycInfo({ document, personType });

    this.logger.debug('KYC found.', { getKYC });

    if (!getKYC) {
      throw new KYCNotFoundException(document);
    }

    pixDecodedAccount.name = getKYC.name;
    pixDecodedAccount.tradeName = getKYC.tradeName;
    pixDecodedAccount.props = getKYC.props;

    return this.storeAccount(pixDecodedAccount);
  }

  private async storeAccount(account: DecodedPixAccount) {
    const newDecodedAccount = await this.repository.create(account);

    // Fire PendingPixDecodedAccount
    this.eventEmitter.pendingDecodedPixAccount(newDecodedAccount);

    this.logger.debug('Decoded By Account created.', { newDecodedAccount });

    return newDecodedAccount;
  }
}
