import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, isCpf } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import { PersonDocumentType } from '@zro/users/domain';
import {
  AccountType,
  PixDeposit,
  PixDepositEntity,
  PixDepositCacheRepository,
  PixDepositState,
  WarningPixSkipListEntity,
  WarningPixSkipListRepository,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  BankingService,
  BankNotFoundException,
  PixDepositReceivedAccountNotFoundException,
  PixDepositEventEmitter,
  PixDepositReceivedBankNotAllowedException,
} from '@zro/pix-payments/application';
import { WalletAccountNotActiveException } from '@zro/operations/application';

export class ReceivePixDepositUseCase {
  /**
   * Consumer of create a received deposit.
   *
   * @param logger Global logger instance.
   * @param pixDepositCacheRepository Pix Deposit Cache Repository.
   * @param warningPixSkipListCacheRepository Warning Pix Skip List Cache Repository.
   * @param pixDepositEventEmitter Pix Deposit event emitter.
   * @param operationService Operation service.
   * @param bankingService Banking service.
   * @param warningPixSkipListRepository Warning Pix Skip List Repository.
   * @param operationCurrencyTag Operation currency tag.
   * @param operationReceivedPixDepositTransactionTag Operation Received Pix Deposit TransactionTag.
   * @param zroBankIspb Zro Bank Ispb.
   * @returns Pix Deposit.
   */
  constructor(
    private logger: Logger,
    private readonly pixDepositCacheRepository: PixDepositCacheRepository,
    private readonly warningPixSkipListCacheRepository: WarningPixSkipListRepository,
    private readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly operationService: OperationService,
    private readonly bankingService: BankingService,
    private readonly warningPixSkipListRepository: WarningPixSkipListRepository,
    private readonly operationCurrencyTag: string,
    private readonly operationReceivedPixDepositTransactionTag: string,
    private readonly zroBankIspb: string,
  ) {
    this.logger = logger.child({ context: ReceivePixDepositUseCase.name });
  }

  /**
   * Create a received PixDeposit.
   *
   * @returns Deposit created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    amount: number,
    txId: string,
    endToEndId: string,
    clientBank: Bank,
    clientBranch: string,
    clientAccountNumber: string,
    clientDocument: string,
    clientName: string,
    clientKey: string,
    thirdPartBank: Bank,
    thirdPartBranch: string,
    thirdPartAccountType: AccountType,
    thirdPartAccountNumber: string,
    thirdPartDocument: string,
    thirdPartName: string,
    thirdPartKey: string,
    description: string,
  ): Promise<PixDeposit> {
    // Data input check
    if (
      !id ||
      !clientBank ||
      !clientBranch ||
      !clientAccountNumber ||
      !clientDocument ||
      !thirdPartBank ||
      !thirdPartAccountNumber ||
      !amount
    ) {
      throw new MissingDataException([
        ...(!id ? ['ID'] : []),
        ...(!clientBank ? ['Client bank'] : []),
        ...(!clientBranch ? ['Client branch'] : []),
        ...(!clientAccountNumber ? ['Client account number'] : []),
        ...(!clientDocument ? ['Client document'] : []),
        ...(!thirdPartBank ? ['Third part bank'] : []),
        ...(!thirdPartAccountNumber ? ['Third part account number'] : []),
        ...(!amount ? ['Amount'] : []),
      ]);
    }

    // Check if deposit's ID is available
    const checkDeposit = await this.pixDepositCacheRepository.getById(id);

    this.logger.debug('Check if deposit already exists.', {
      deposit: checkDeposit,
    });

    // Check indepotent
    if (checkDeposit) {
      return checkDeposit;
    }

    // Check if deposit is headed to Zrobank.
    if (!clientBank.isSameIspb(this.zroBankIspb)) {
      throw new PixDepositReceivedBankNotAllowedException(clientBank.ispb);
    }

    // Get client bank by ispb
    const foundBankClient = await this.bankingService.getBankByIspb(
      clientBank.ispb,
    );

    this.logger.debug('Bank by ispb client found.', { foundBankClient });

    if (!foundBankClient) {
      throw new BankNotFoundException(foundBankClient);
    }

    // Get third part bank by ispb
    const foundBankThirdPart = await this.bankingService.getBankByIspb(
      thirdPartBank.ispb,
    );

    this.logger.debug('Bank by ispb third part found.', {
      bank: foundBankThirdPart,
    });

    if (!foundBankThirdPart) {
      throw new BankNotFoundException(foundBankThirdPart);
    }

    const currency = new CurrencyEntity({ tag: this.operationCurrencyTag });

    // Check account number for client (beneficiary zrobank)
    const beneficiaryWalletAccount =
      await this.operationService.getWalletAccountByAccountNumberAndCurrency(
        clientAccountNumber,
        currency,
      );

    this.logger.debug('Wallet account client found.', {
      walletAccount: beneficiaryWalletAccount,
    });

    if (!beneficiaryWalletAccount) {
      throw new PixDepositReceivedAccountNotFoundException(clientAccountNumber);
    }
    if (!beneficiaryWalletAccount.isActive()) {
      throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
    }

    // Create deposit with payment data
    const deposit = new PixDepositEntity({
      id,
      state: PixDepositState.NEW,
      operation: new OperationEntity({ id: uuidV4() }),
      user: beneficiaryWalletAccount.wallet.user,
      wallet: beneficiaryWalletAccount.wallet,
      txId,
      endToEndId,
      amount,
      clientBank: foundBankClient,
      clientBranch,
      clientAccountNumber,
      clientPersonType: isCpf(clientDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBank: foundBankThirdPart,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartPersonType: isCpf(thirdPartDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      description,
      transactionTag: this.operationReceivedPixDepositTransactionTag,
    });

    // Create deposit
    const newDeposit = await this.pixDepositCacheRepository.create(deposit);

    this.logger.debug('Deposit in Cache added.', { deposit: newDeposit });

    if (await this.isInSkipList(deposit)) {
      this.pixDepositEventEmitter.waitingDeposit(deposit);

      return deposit;
    }

    this.pixDepositEventEmitter.newDeposit(deposit);

    return deposit;
  }

  async isInSkipList(deposit: PixDeposit): Promise<boolean> {
    // Check if client's account number is in compliance's skip list
    let skipAccountCache =
      await this.warningPixSkipListCacheRepository.getByClientAccountNumber(
        deposit.clientAccountNumber,
      );

    if (skipAccountCache) return true;

    const skipAccount =
      await this.warningPixSkipListRepository.getByClientAccountNumber(
        deposit.clientAccountNumber,
      );

    if (!skipAccount) return false;

    skipAccountCache = new WarningPixSkipListEntity({
      id: skipAccount.id,
      user: skipAccount.user,
      clientAccountNumber: skipAccount.clientAccountNumber,
      description: skipAccount.description ?? null,
      createdAt: skipAccount.createdAt,
      updatedAt: skipAccount.updatedAt,
    });

    await this.warningPixSkipListCacheRepository.create(skipAccountCache);

    return true;
  }
}
