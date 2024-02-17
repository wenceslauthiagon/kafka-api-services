import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException, isCpf } from '@zro/common';
import { Bank } from '@zro/banking/domain';
import { PersonDocumentType } from '@zro/users/domain';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import {
  AccountType,
  PixDevolutionReceived,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
  PaymentRepository,
  Payment,
} from '@zro/pix-payments/domain';
import {
  OperationService,
  BankingService,
  BankNotFoundException,
  PixDevolutionReceivedAccountNotFoundException,
  PixDevolutionReceivedEventEmitter,
  PixDevolutionReceivedBankNotAllowedException,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import { WalletAccountNotActiveException } from '@zro/operations/application';

export class ReceivePixDevolutionReceivedUseCase {
  /**
   * @param logger Global logger instance.
   * @param pixDevolutionReceivedRepository Deposit repository.
   * @param eventEmitter PixDevolutionReceived event emitter.
   * @param operationService Operation service gateway.
   * @param bankingService Banking service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly pixDevolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly pixPaymentRepository: PaymentRepository,
    private readonly eventEmitter: PixDevolutionReceivedEventEmitter,
    private readonly operationService: OperationService,
    private readonly bankingService: BankingService,
    private readonly operationCurrencyTag: string,
    private readonly pixDevolutionReceivedOperationTransactionTag: string,
    private readonly zroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: ReceivePixDevolutionReceivedUseCase.name,
    });
  }

  /**
   * Create a received PixDevolutionReceived.
   *
   * @returns PixDevolutionReceived created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(
    id: string,
    payment: Payment,
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
  ): Promise<PixDevolutionReceived> {
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

    // Check if devolution received ID is available
    const devolutionReceivedFound =
      await this.pixDevolutionReceivedRepository.getById(id);

    this.logger.debug('Check if devolutionReceived already exists.', {
      devolutionReceived: devolutionReceivedFound,
    });

    // Check indepotent
    if (devolutionReceivedFound) {
      return devolutionReceivedFound;
    }

    // Check if pixDevolutionReceived is headed to Zrobank.
    if (!clientBank.isSameIspb(this.zroBankIspb)) {
      throw new PixDevolutionReceivedBankNotAllowedException(clientBank.ispb);
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

    this.logger.debug('Bank by ispb third part found.', { foundBankThirdPart });

    if (!foundBankThirdPart) {
      throw new BankNotFoundException(foundBankThirdPart);
    }

    // Check if pixDevolutionReceived is related to a previous payment.
    const paymentFound =
      (payment.id || payment.endToEndId) &&
      (await this.pixPaymentRepository.getByIdOrEndToEndId(
        payment.id,
        payment.endToEndId,
      ));

    if (!paymentFound) {
      throw new PaymentNotFoundException(payment);
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
      throw new PixDevolutionReceivedAccountNotFoundException(
        clientAccountNumber,
      );
    }
    if (!beneficiaryWalletAccount.isActive()) {
      throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
    }

    // Create pixDevolutionReceived
    const pixDevolutionReceived = new PixDevolutionReceivedEntity({
      id,
      state: PixDevolutionReceivedState.READY,
      operation: new OperationEntity({ id: uuidV4() }),
      user: paymentFound.user,
      wallet: paymentFound.wallet,
      payment,
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
      transactionTag: this.pixDevolutionReceivedOperationTransactionTag,
    });

    // Create pixDevolutionReceived
    const createdPixDevolutionReceived =
      await this.pixDevolutionReceivedRepository.create(pixDevolutionReceived);

    this.logger.debug('Added pixDevolutionReceived.', {
      pixDevolutionReceived: createdPixDevolutionReceived,
    });

    // Create and accept operation
    const operation = new OperationEntity({
      id: createdPixDevolutionReceived.operation.id,
      rawValue: createdPixDevolutionReceived.amount,
      currency,
      description: this.pixDevolutionReceivedOperationTransactionTag,
    });

    await this.operationService.createAndAcceptOperation(
      pixDevolutionReceived.transactionTag,
      operation,
      null,
      paymentFound.wallet,
    );

    this.logger.debug(
      'Created and accepted operation for beneficiary ZroBank.',
      { operation },
    );

    // Fire ReadyDevolutionReceived
    this.eventEmitter.readyDevolutionReceived({
      ...createdPixDevolutionReceived,
      refundOperationId: uuidV4(),
    });

    return createdPixDevolutionReceived;
  }
}
