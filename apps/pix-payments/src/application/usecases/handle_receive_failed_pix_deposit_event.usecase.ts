import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, isCpf } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import { PersonDocumentType, UserEntity } from '@zro/users/domain';
import { OperationEntity, WalletEntity } from '@zro/operations/domain';
import {
  AccountType,
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
  PixDevolutionEntity,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  BankingService,
  UserService,
  PixDepositEventEmitter,
  PixDevolutionEventEmitter,
  PixDepositReceivedBankNotAllowedException,
} from '@zro/pix-payments/application';

export class HandleReceiveFailedPixDepositEventUseCase {
  /**
   * Consumer of create a failed received deposit.
   *
   * @param logger Global logger instance.
   * @param depositRepository Pix Deposit Repository.
   * @param pixDepositEventEmitter Pix Deposit event emitter.
   * @param pixDevolutionEventEmitter Pix Devolution event emitter.
   * @param bankingService Banking service.
   * @param operationReceivedPixDepositTransactionTag Operation Received Pix Deposit TransactionTag.
   * @param zroBankIspb Zro Bank Ispb.
   */
  constructor(
    private logger: Logger,
    private readonly depositRepository: PixDepositRepository,
    private readonly pixDepositEventEmitter: PixDepositEventEmitter,
    private readonly pixDevolutionEventEmitter: PixDevolutionEventEmitter,
    private readonly bankingService: BankingService,
    private readonly userService: UserService,
    private readonly operationReceivedPixDepositTransactionTag: string,
    private readonly zroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: HandleReceiveFailedPixDepositEventUseCase.name,
    });
  }

  /**
   * Create a failed received pix deposit.
   *
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
  ): Promise<void> {
    // Data input check
    if (
      !id ||
      !clientBank ||
      !clientBranch ||
      !clientAccountNumber ||
      !clientDocument ||
      !thirdPartBank ||
      !thirdPartAccountNumber ||
      !amount ||
      !description
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
        ...(!description ? ['Description'] : []),
      ]);
    }

    // Check if deposit's ID is available
    const checkDeposit = await this.depositRepository.getById(id);

    this.logger.debug('Check if deposit already exists.', {
      deposit: checkDeposit,
    });

    // Check indepotent
    if (checkDeposit) {
      return;
    }

    // Check if deposit is headed to Zrobank.
    if (!clientBank.isSameIspb(this.zroBankIspb)) {
      throw new PixDepositReceivedBankNotAllowedException(clientBank.ispb);
    }

    // Get client bank by ispb
    const foundBankClient = await this.bankingService.getBankByIspb(
      clientBank.ispb,
    );

    this.logger.debug('Found bank by ispb client.', { foundBankClient });

    // Get third part bank by ispb
    const foundBankThirdPart = await this.bankingService.getBankByIspb(
      thirdPartBank.ispb,
    );

    this.logger.debug('Found bank by ispb third part.', { foundBankThirdPart });

    const userFound = await this.userService.getUserByDocument({
      document: clientDocument,
    });

    this.logger.debug('Found user by document.', { userFound });

    const user = userFound
      ? new UserEntity({ ...userFound })
      : new UserEntity({
          uuid: uuidV4(),
          document: clientDocument,
          fullName: clientName,
          active: false,
        });

    const operation = new OperationEntity({ id: uuidV4() });
    const wallet = new WalletEntity({ uuid: uuidV4() });

    // Create failed deposit with payment data
    const pixDeposit = new PixDepositEntity({
      id,
      state: PixDepositState.ERROR,
      description,
      operation,
      user,
      wallet,
      txId,
      endToEndId,
      amount,
      clientBank: foundBankClient ?? clientBank,
      clientBranch,
      clientAccountNumber,
      clientPersonType: isCpf(clientDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      clientDocument,
      clientName,
      clientKey,
      thirdPartBank: foundBankThirdPart ?? thirdPartBank,
      thirdPartBranch,
      thirdPartAccountType,
      thirdPartAccountNumber,
      thirdPartPersonType: isCpf(thirdPartDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      thirdPartDocument,
      thirdPartName,
      thirdPartKey,
      transactionTag: this.operationReceivedPixDepositTransactionTag,
    });

    // Create deposit
    const newDeposit = await this.depositRepository.create(pixDeposit);

    this.logger.debug('Added new failed deposit.', { deposit: newDeposit });

    // Fire received failed pix deposit
    this.pixDepositEventEmitter.receivedFailedDeposit(pixDeposit);

    const pixDevolution = new PixDevolutionEntity({
      id: uuidV4(),
      state: PixDevolutionState.PENDING,
      deposit: pixDeposit,
    });

    // Fire CreateFailedPixDevolutionEvent
    this.pixDevolutionEventEmitter.createFailedPixDevolution(pixDevolution);
  }
}
