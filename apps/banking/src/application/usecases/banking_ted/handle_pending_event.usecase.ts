import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { getMoment, isCpf, MissingDataException } from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  OperationEntity,
  Wallet,
  WalletAccount,
} from '@zro/operations/domain';
import {
  BankingTed,
  BankingTedRepository,
  BankTedRepository,
  BankingTedState,
  PurposeCode,
  BankingTedReceivedEntity,
  BankingTedReceivedRepository,
  BankingContactEntity,
  BankingAccountContactEntity,
  BankingContactRepository,
  BankingAccountContactRepository,
} from '@zro/banking/domain';
import { PersonDocumentType } from '@zro/users/domain';
import {
  OperationService,
  UserService,
  BankingTedEventEmitter,
  BankingTedReceivedEventEmitter,
  CreateBankingTedPspRequest,
  BankingTedGateway,
  BankingTedNotFoundException,
  BankingTedInvalidStateException,
  BankingTedZroAccountNotExistsException,
  BankTedNotFoundException,
} from '@zro/banking/application';
import { OnboardingNotFoundException } from '@zro/users/application';
import {
  WalletAccountNotActiveException,
  WalletAccountNotFoundException,
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';

export class HandlePendingBankingTedEventUseCase {
  private readonly bankingTedCurrency: Currency;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param bankingTedRepository BankingTed repository.
   * @param bankTedRepository BankTed repository.
   * @param bankingTedReceivedRepository BankingTedReceived repository.
   * @param pspGateway BankingTed psp gateway.
   * @param bankingTedEventEmitter BankingTed event emitter.
   * @param bankingTedReceivedEventEmitter BankingTedReceived event emitter.
   * @param operationService Operation service.
   * @param userService User service.
   * @param bankingTedOperationCurrencyTag REAL Currency tag.
   * @param bankingTedOperationTedP2PTransactionTag P2PBT Transaction tag.
   * @param bankingTedOperationTedTransactionTag TED transaction tag.
   * @param bankingTedOperationTedP2PDescription TED P2P Description - Bank P2P Transfer.
   * @param bankingTedOperationTedDescription TED Description - Bank TED Transfer.
   * @param bankingTedZroBankCode Code ZroBank.
   * @param bankingTedCallbackUrl Callback ETF notify.
   */
  constructor(
    private logger: Logger,
    private readonly bankingTedRepository: BankingTedRepository,
    private readonly bankTedRepository: BankTedRepository,
    private readonly bankingTedReceivedRepository: BankingTedReceivedRepository,
    private readonly bankingContactRepository: BankingContactRepository,
    private readonly bankingAccountContactRepository: BankingAccountContactRepository,
    private readonly pspGateway: BankingTedGateway,
    private readonly bankingTedEventEmitter: BankingTedEventEmitter,
    private readonly bankingTedReceivedEventEmitter: BankingTedReceivedEventEmitter,
    private readonly operationService: OperationService,
    private readonly userService: UserService,
    private readonly bankingTedOperationCurrencyTag: string,
    private readonly bankingTedOperationTedP2PTransactionTag: string,
    private readonly bankingTedOperationTedTransactionTag: string,
    private readonly bankingTedOperationTedP2PDescription: string,
    private readonly bankingTedOperationTedDescription: string,
    private readonly bankingTedZroBankCode: string,
    private readonly bankingTedCallbackUrl: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingBankingTedEventUseCase.name,
    });

    this.bankingTedCurrency = new CurrencyEntity({
      tag: this.bankingTedOperationCurrencyTag,
    });
  }

  /**
   * Handler triggered when bankingTed is pending.
   *
   * @param id bankingTed id.
   * @param ownerWallet bankingTed wallet.
   * @returns BankingTed created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {BankingTedNotFoundException} Thrown when bankingTed id was not found.
   * @throws {BankingTedInvalidStateException} Thrown when bankingTed state is not pending.
   */
  async execute(id: number, ownerWallet: Wallet): Promise<BankingTed> {
    // Data input check
    if (!id || !ownerWallet?.uuid) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!ownerWallet?.uuid ? ['Wallet ID'] : []),
      ]);
    }

    // Search bankingTed
    const bankingTed = await this.bankingTedRepository.getById(id);

    this.logger.debug('Found BankingTed.', { bankingTed });

    if (!bankingTed) {
      throw new BankingTedNotFoundException({ id });
    }

    // Check indepotent
    if (bankingTed.isAlreadyPaidBankingTed()) {
      return bankingTed;
    }

    // Only PENDING bankingTed is accept.
    if (bankingTed.state !== BankingTedState.PENDING) {
      throw new BankingTedInvalidStateException(bankingTed);
    }

    // Search and validate user
    const ownerUserFound = await this.userService.getUserByUuid(
      bankingTed.user,
    );

    this.logger.debug('Found user.', { user: ownerUserFound });

    if (!ownerUserFound?.document || !ownerUserFound?.fullName) {
      throw new MissingDataException([
        ...(!ownerUserFound?.document ? ['Document'] : []),
        ...(!ownerUserFound?.fullName ? ['FullName'] : []),
      ]);
    }

    Object.assign(bankingTed.user, ownerUserFound);

    // Get ownerUser wallet account to get Client account number and Client branch
    const ownerWalletAccount =
      await this.operationService.getWalletAccountByWalletAndCurrency(
        ownerWallet,
        this.bankingTedCurrency,
      );

    // Check if owner wallet is zrobank
    if (!ownerWalletAccount) {
      this.logger.debug('OwnerWalletAccount not found.', {
        ownerWalletAccount,
      });
      throw new WalletAccountNotFoundException({ wallet: ownerWallet });
    }
    if (!ownerWalletAccount.isActive()) {
      this.logger.debug('OwnerWalletAccount not active.', {
        ownerWalletAccount,
      });
      throw new WalletAccountNotActiveException(ownerWalletAccount);
    }
    if (!ownerWalletAccount.accountNumber || !ownerWalletAccount.branchNumber) {
      throw new MissingDataException([
        ...(!ownerWalletAccount.accountNumber ? ['Account Number'] : []),
        ...(!ownerWalletAccount.branchNumber ? ['Branch Number'] : []),
      ]);
    }

    // Check if bankingTed beneficiary account is zrobank
    if (bankingTed.beneficiaryBankCode !== this.bankingTedZroBankCode) {
      // Beneficiary is not zroBank, send bankingTed PSP
      return this.sendBankingTedPSP(bankingTed, ownerWalletAccount);
    }

    // Get finished beneficiary wallet onboarding
    const beneficiaryAccountNumber =
      bankingTed.beneficiaryAccount + bankingTed.beneficiaryAccountDigit;

    const beneficiaryOnboarding =
      await this.userService.getOnboardingByAccountNumberAndStatusIsFinished(
        beneficiaryAccountNumber,
      );

    this.logger.debug('Onboarding found.', { beneficiaryOnboarding });

    if (!beneficiaryOnboarding) {
      throw new OnboardingNotFoundException({
        accountNumber: beneficiaryAccountNumber,
      });
    }

    const beneficiaryWallet =
      await this.operationService.getWalletByUserAndDefaultIsTrue(
        beneficiaryOnboarding.user,
      );

    // Check if beneficiary wallet is zrobank
    if (!beneficiaryWallet) {
      this.logger.debug('BeneficiaryWallet not found.', { beneficiaryWallet });
      throw new WalletNotFoundException({ user: beneficiaryOnboarding.user });
    }
    if (!beneficiaryWallet.isActive()) {
      this.logger.debug('BeneficiaryWallet not active.', { beneficiaryWallet });
      throw new WalletNotActiveException(beneficiaryWallet);
    }

    const beneficiaryWalletAccount =
      await this.operationService.getWalletAccountByWalletAndCurrency(
        beneficiaryWallet,
        this.bankingTedCurrency,
      );

    this.logger.debug('BeneficiaryWalletAccount found', {
      beneficiaryWalletAccount,
    });

    // Check if beneficiary account is zrobank
    if (!beneficiaryWalletAccount) {
      throw new BankingTedZroAccountNotExistsException(bankingTed);
    }
    if (!beneficiaryWalletAccount.isActive()) {
      throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
    }

    // Search beneficiary user
    const beneficiaryUserFound = await this.userService.getUserByUuid(
      beneficiaryWallet.user,
    );

    this.logger.debug('Found beneficiary user.', {
      user: beneficiaryUserFound,
    });

    Object.assign(beneficiaryWallet.user, beneficiaryUserFound);

    // Beneficiary is zroBank, send bankingTed for zro
    return this.sendBankingTedP2P(
      bankingTed,
      ownerWallet,
      beneficiaryWallet,
      ownerWalletAccount,
    );
  }

  /**
   * @param bankingTed
   * @param ownerWalletAccount
   * @returns bankingTed
   */
  async sendBankingTedPSP(
    bankingTed: BankingTed,
    ownerWalletAccount: WalletAccount,
  ): Promise<BankingTed> {
    this.logger.debug('Preparing bankingTed for send to PSP.', { bankingTed });

    const transactionId = uuidV4();
    const body: CreateBankingTedPspRequest = {
      transactionId,
      ownerDocument: bankingTed.user.document,
      ownerName: bankingTed.user.fullName,
      ownerAccount: ownerWalletAccount.accountNumber,
      beneficiaryDocument: bankingTed.beneficiaryDocument,
      beneficiaryName: bankingTed.beneficiaryName,
      beneficiaryBankCode: bankingTed.beneficiaryBankCode,
      beneficiaryAgency: bankingTed.beneficiaryAgency,
      beneficiaryAccount: bankingTed.beneficiaryAccount,
      beneficiaryAccountDigit: bankingTed.beneficiaryAccountDigit,
      beneficiaryAccountType: bankingTed.beneficiaryAccountType,
      amount: bankingTed.amount,
      purposeCode: PurposeCode.TED_10,
      callbackUrl: `${this.bankingTedCallbackUrl}/${transactionId}`,
    };

    const pspResult = await this.pspGateway.createBankingTed(body);

    this.logger.debug('BankingTed sent to pspGateway.', { pspResult });

    await this.createAndAcceptOperationPSP(
      bankingTed,
      ownerWalletAccount.wallet,
    );

    // BankingTed is waiting.
    bankingTed.transactionId = transactionId;
    bankingTed.state = BankingTedState.WAITING;

    // Update bankingTed
    await this.bankingTedRepository.update(bankingTed);

    // Fire waitingBankingTed
    this.bankingTedEventEmitter.waitingBankingTed(bankingTed);

    this.logger.debug('Updated bankingTed with waiting status.', {
      bankingTed,
    });

    await this.createBankingContact(bankingTed);

    return bankingTed;
  }

  /**
   * @param bankingTed
   * @param ownerWallet Wallet owner Zrobank
   * @param beneficiaryWallet Wallet beneficiary Zrobank
   * @param ownerWalletAccount
   * @returns bankingTed
   */
  async sendBankingTedP2P(
    bankingTed: BankingTed,
    ownerWallet: Wallet,
    beneficiaryWallet: Wallet,
    ownerWalletAccount: WalletAccount,
  ): Promise<BankingTed> {
    this.logger.debug('Preparing bankingTed for send to P2P.', { bankingTed });

    // Get bank by code
    const foundBank = await this.bankTedRepository.getByCode(
      bankingTed.beneficiaryBankCode,
    );

    this.logger.debug('Found bank by code.', { foundBank });

    if (!foundBank) {
      throw new BankTedNotFoundException(foundBank);
    }

    await this.createAndAcceptOperationP2P(
      bankingTed,
      ownerWallet,
      beneficiaryWallet,
    );

    this.logger.debug('Accepted BankingTed for beneficiary ZroBank.', {
      bankingTed,
    });

    // Create bankingTedReceived with bankingTed
    const bankingTedReceived = new BankingTedReceivedEntity({
      operation: new OperationEntity({ id: bankingTed.operation.id }),
      ownerDocument: bankingTed.user.document,
      ownerName: bankingTed.user.fullName,
      ownerBankAccount: ownerWalletAccount.accountNumber,
      ownerBankBranch: ownerWalletAccount.branchNumber,
      ownerBankCode: foundBank.code,
      ownerBankName: foundBank.name,
    });

    // Create bankingTedReceived
    const newBankingTedReceived =
      await this.bankingTedReceivedRepository.create(bankingTedReceived);

    // Fire received banking ted
    this.bankingTedReceivedEventEmitter.receivedBankingTed(bankingTedReceived);

    this.logger.debug('Added bankingTedReceived data.', {
      bankingTedReceived: newBankingTedReceived,
    });

    // BankingTed is confirmed.
    bankingTed.state = BankingTedState.CONFIRMED;
    bankingTed.confirmedAt = getMoment().toDate();

    // Update bankingTed
    await this.bankingTedRepository.update(bankingTed);

    // Fire confirmedBankingTed
    this.bankingTedEventEmitter.confirmedBankingTed(bankingTed);

    this.logger.debug('Updated bankingTed with confirmed status.', {
      bankingTed,
    });

    await this.createBankingContact(bankingTed, beneficiaryWallet);

    return bankingTed;
  }

  private async createAndAcceptOperationPSP(
    bankingTed: BankingTed,
    ownerWallet: Wallet,
  ): Promise<void> {
    // Create operation without beneficiary
    const operation = new OperationEntity({
      id: bankingTed.operation.id,
      rawValue: bankingTed.amount,
      currency: this.bankingTedCurrency,
      description: this.bankingTedOperationTedDescription,
    });

    await this.operationService.createAndAcceptOperation(
      this.bankingTedOperationTedTransactionTag,
      operation,
      ownerWallet,
    );
  }

  private async createAndAcceptOperationP2P(
    bankingTed: BankingTed,
    ownerWallet: Wallet,
    beneficiaryWallet: Wallet,
  ): Promise<void> {
    // Create operation with beneficiary
    const operation = new OperationEntity({
      id: bankingTed.operation.id,
      rawValue: bankingTed.amount,
      currency: this.bankingTedCurrency,
      description: this.bankingTedOperationTedP2PDescription,
    });

    await this.operationService.createAndAcceptOperation(
      this.bankingTedOperationTedP2PTransactionTag,
      operation,
      ownerWallet,
      beneficiaryWallet,
    );
  }

  private async createBankingContact(
    bankingTed: BankingTed,
    beneficiaryWallet?: Wallet,
  ) {
    // Search bankingContact by user
    let bankingContact =
      await this.bankingContactRepository.getByUserAndDocument(
        bankingTed.user,
        bankingTed.beneficiaryDocument,
      );

    this.logger.debug('BankingContact by user found.', {
      bankingContact: bankingContact,
    });

    // Create bankingContact if not exists
    if (!bankingContact) {
      const beneficiaryUser = beneficiaryWallet?.user;

      // Create bankingContact
      const newBankingContact = new BankingContactEntity({
        user: bankingTed.user,
        name: bankingTed.beneficiaryName,
        document: bankingTed.beneficiaryDocument,
        documentType: isCpf(bankingTed.beneficiaryDocument)
          ? PersonDocumentType.CPF
          : PersonDocumentType.CNPJ,
        contactUser: beneficiaryUser,
      });

      // Save bankingContact
      bankingContact =
        await this.bankingContactRepository.create(newBankingContact);

      this.logger.debug('Created new bankingContact.', {
        bankingContact: newBankingContact,
      });
    }

    // Check if bankingAccountContact already exists
    const bankingAccountContacts =
      await this.bankingAccountContactRepository.getByBankingContact(
        bankingContact,
      );

    const bankingAccountContactFound = bankingAccountContacts.find(
      (account) =>
        account.branchNumber === bankingTed.beneficiaryAgency &&
        account.accountNumber === bankingTed.beneficiaryAccount &&
        account.accountDigit === bankingTed.beneficiaryAccountDigit &&
        account.bankName === bankingTed.beneficiaryBankName &&
        account.bankCode === bankingTed.beneficiaryBankCode &&
        account.accountType === bankingTed.beneficiaryAccountType,
    );

    this.logger.debug('Found bankingAccountContact by bankingContact.', {
      bankingAccountContact: bankingAccountContactFound,
    });

    if (bankingAccountContactFound) {
      return;
    }

    const newBankingAccountContact = new BankingAccountContactEntity({
      bankingContact: bankingContact,
      bankName: bankingTed.beneficiaryBankName,
      bankCode: bankingTed.beneficiaryBankCode,
      accountType: bankingTed.beneficiaryAccountType,
      branchNumber: bankingTed.beneficiaryAgency,
      accountNumber: bankingTed.beneficiaryAccount,
      accountDigit: bankingTed.beneficiaryAccountDigit,
    });

    await this.bankingAccountContactRepository.create(newBankingAccountContact);

    this.logger.debug('Created new bankingAccountContact.', {
      bankingAccountContact: newBankingAccountContact,
    });
  }
}
