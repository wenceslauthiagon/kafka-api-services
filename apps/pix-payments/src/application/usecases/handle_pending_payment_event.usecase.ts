import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { isCpf, MissingDataException } from '@zro/common';
import { PersonType, PersonDocumentType } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  Payment,
  PaymentRepository,
  PaymentState,
  PixDepositEntity,
  PixDepositRepository,
  PixDepositState,
  AccountType,
} from '@zro/pix-payments/domain';
import {
  PaymentNotFoundException,
  PaymentInvalidStateException,
  OperationService,
  BankingService,
  PaymentEventEmitter,
  BankNotFoundException,
  PixPaymentGateway,
  CreatePaymentPixPaymentPspRequest,
  PixDepositEventEmitter,
  PixPaymentZroAccountNotExistsException,
  PaymentBetweenSameWalletException,
} from '@zro/pix-payments/application';
import { WalletAccountNotActiveException } from '@zro/operations/application';

export class HandlePendingPaymentEventUseCase {
  private readonly currency: Currency;

  /**
   * Default constructor.
   * @param logger Global logger.
   * @param paymentRepository Payment repository.
   * @param depositRepository Deposit repository.
   * @param pspGateway Payment psp gateway.
   * @param paymentEventEmitter Payment event emitter.
   * @param operationService Operation service.
   * @param bankingService Banking service.
   * @param depositEventEmitter Deposit event emitter.
   */
  constructor(
    private readonly logger: Logger,
    private readonly paymentRepository: PaymentRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly paymentEventEmitter: PaymentEventEmitter,
    private readonly operationService: OperationService,
    private readonly bankingService: BankingService,
    private readonly depositEventEmitter: PixDepositEventEmitter,
    private readonly pixPaymentOperationCurrencyTag: string,
    private readonly pixPaymentOperationDescription: string,
    private readonly pixPaymentOperationNewPixReceivedTransactionTag: string,
    private readonly pixPaymentZroBankIspb: string,
    private readonly pixPaymentOperationChangeTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingPaymentEventUseCase.name,
    });

    this.currency = new CurrencyEntity({
      tag: this.pixPaymentOperationCurrencyTag,
    });
  }

  /**
   * Handler triggered when payment is pending.
   *
   * @param id payment id id.
   * @returns Payment created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PaymentNotFoundException} Thrown when payment id was not found.
   * @throws {PaymentInvalidStateException} Thrown when payment state is not pending.
   */
  async execute(id: string): Promise<Payment> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search payment
    const payment = await this.paymentRepository.getById(id);

    this.logger.debug('Found Payment.', { payment });

    if (!payment) {
      throw new PaymentNotFoundException({ id });
    }

    // Check indepotent
    if (payment.isAlreadyPaid()) {
      return payment;
    }

    // Only PENDING payment is accept.
    if (payment.state !== PaymentState.PENDING) {
      throw new PaymentInvalidStateException(payment);
    }

    // Check if payment beneficiary account is zrobank
    if (payment.beneficiaryBankIspb !== this.pixPaymentZroBankIspb) {
      // Beneficiary is not zroBank, send payment PSP
      return this.sendPaymentPSP(payment);
    }

    const beneficiaryWalletAccount =
      await this.operationService.getWalletAccountByAccountNumberAndCurrency(
        payment.beneficiaryAccountNumber,
        this.currency,
      );

    this.logger.debug('BeneficiaryWalletAccount found.', {
      beneficiaryWalletAccount,
    });

    // Check if beneficiary account is zrobank
    if (!beneficiaryWalletAccount) {
      throw new PixPaymentZroAccountNotExistsException(payment);
    }
    if (!beneficiaryWalletAccount.isActive()) {
      throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
    }

    // Check if user is trying to pay his own payment.
    if (payment.wallet.uuid === beneficiaryWalletAccount.wallet.uuid) {
      throw new PaymentBetweenSameWalletException(
        payment.wallet,
        beneficiaryWalletAccount.wallet,
      );
    }

    // Beneficiary is zroBank, send payment for zro
    return this.sendPaymentP2P(
      payment,
      payment.wallet,
      beneficiaryWalletAccount.wallet,
    );
  }

  /**
   * @param payment
   * @returns payment
   */
  private async sendPaymentPSP(payment: Payment): Promise<Payment> {
    this.logger.debug('Preparing payment for send to PSP.', { payment });

    await this.createOperationPSP(payment, payment.wallet);

    if (payment.changeOperation?.id) {
      await this.createChangeOperationPSP(payment, payment.wallet);
      await this.operationService.setOperationReference(
        payment.operation,
        payment.changeOperation,
      );
    }

    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: payment.id,
      value: payment.value,
      description: payment.description,
      ownerAccountNumber: payment.ownerAccountNumber,
      ownerBranch: payment.ownerBranch,
      ownerPersonType: payment.ownerPersonType,
      ownerDocument: payment.ownerDocument,
      ownerName: payment.ownerFullName,
      beneficiaryBankIspb: payment.beneficiaryBankIspb,
      beneficiaryBranch: payment.beneficiaryBranch,
      beneficiaryAccountType: payment.beneficiaryAccountType,
      beneficiaryAccountNumber: payment.beneficiaryAccountNumber,
      beneficiaryName: payment.beneficiaryName,
      beneficiaryPersonType: payment.beneficiaryPersonType,
      beneficiaryDocument: payment.beneficiaryDocument,
      beneficiaryKey: payment.key,
      endToEndId: payment.endToEndId,
      txId: payment.txId,
      agentMod: payment.agentMod,
      agentIspb: payment.agentIspb,
      createdAt: payment.createdAt,
      paymentType: payment.paymentType,
      priorityType: payment.priorityType,
      ispb: this.pixPaymentZroBankIspb,
    };

    this.logger.debug('Create pix payment on PSP request.', {
      paymentId: payment.id,
    });

    const pspResult = await this.pspGateway.createPayment(body);

    this.logger.info('Create pix refund devolution on PSP response.', {
      response: pspResult,
    });

    // Payment is waiting.
    payment.endToEndId = pspResult.endToEndId;
    payment.state = PaymentState.WAITING;
    payment.externalId = pspResult.externalId;

    // Update payment
    await this.paymentRepository.update(payment);

    // Fire WaitingPayment
    this.paymentEventEmitter.waitingPayment(payment);

    this.logger.debug('Updated payment with waiting status.', { payment });

    return payment;
  }

  /**
   * @param payment
   * @param ownerWallet User owner Zrobank
   * @param beneficiaryUser User beneficiary Zrobank
   * @returns payment
   */
  private async sendPaymentP2P(
    payment: Payment,
    ownerWallet: Wallet,
    beneficiaryWallet: Wallet,
  ): Promise<Payment> {
    this.logger.debug('Preparing payment for send to P2P.', { payment });

    // Is PIX change?
    if (payment.changeOperation?.id) {
      await this.createAndAcceptOperationP2P(
        payment,
        ownerWallet,
        beneficiaryWallet,
      );

      await this.createAndAcceptChangeOperationP2P(
        payment,
        ownerWallet,
        beneficiaryWallet,
      );
      await this.operationService.setOperationReference(
        payment.operation,
        payment.changeOperation,
      );
    } else {
      // No, it's a simple P2P payment.
      await this.createAndAcceptOperationP2P(
        payment,
        ownerWallet,
        beneficiaryWallet,
      );
    }

    this.logger.debug('Accepted Payment for beneficiary ZroBank.', { payment });

    // Get bank by ispb
    const foundBank = await this.bankingService.getBankByIspb(
      payment.beneficiaryBankIspb,
    );

    this.logger.debug('Bank by ispb found.', { foundBank });

    if (!foundBank) {
      throw new BankNotFoundException(foundBank);
    }

    // Create deposit with payment data
    const deposit = new PixDepositEntity({
      id: uuidV4(),
      state: PixDepositState.RECEIVED,
      operation: new OperationEntity({ id: payment.operation.id }),
      user: beneficiaryWallet.user,
      wallet: beneficiaryWallet,
      txId: payment.txId,
      amount: payment.value,
      clientBank: foundBank,
      clientBranch: payment.beneficiaryBranch,
      clientAccountNumber: payment.beneficiaryAccountNumber,
      clientPersonType:
        payment.beneficiaryPersonType === PersonType.LEGAL_PERSON
          ? PersonDocumentType.CNPJ
          : PersonDocumentType.CPF,
      clientDocument: payment.beneficiaryDocument,
      clientName: payment.beneficiaryName,
      clientKey: payment.key,
      thirdPartBank: foundBank,
      thirdPartBranch: payment.ownerBranch,
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: payment.ownerAccountNumber,
      thirdPartPersonType: isCpf(payment.ownerDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      thirdPartDocument: payment.ownerDocument,
      thirdPartName: payment.ownerFullName,
      thirdPartKey: null,
      description: payment.description,
      transactionTag: this.pixPaymentOperationNewPixReceivedTransactionTag,
    });

    // Create deposit
    const newDeposit = await this.depositRepository.create(deposit);

    // Fire received pix deposit
    this.depositEventEmitter.receivedDeposit({
      ...deposit,
      refundOperationId: uuidV4(),
    });

    this.logger.debug('Added deposit with payment data.', {
      deposit: newDeposit,
    });

    // Payment is confirmed.
    payment.state = PaymentState.CONFIRMED;

    // Update payment
    await this.paymentRepository.update(payment);

    // Fire ConfirmedPayment
    this.paymentEventEmitter.confirmedPayment(payment);

    this.logger.debug('Updated payment with confirmed status.', { payment });

    return payment;
  }

  private async createOperationPSP(payment: Payment, ownerWallet: Wallet) {
    // Create operation without beneficiary
    const operation = new OperationEntity({
      id: payment.operation.id,
      rawValue: payment.value,
      currency: this.currency,
      description: this.pixPaymentOperationDescription,
    });

    await this.operationService.createOperation(
      payment.transactionTag,
      operation,
      ownerWallet,
    );
  }

  private async createChangeOperationPSP(
    payment: Payment,
    ownerWallet: Wallet,
  ) {
    // Create changeOperation without beneficiary
    const operation = new OperationEntity({
      id: payment.changeOperation.id,
      rawValue: payment.value,
      currency: this.currency,
      description: this.pixPaymentOperationDescription,
    });

    await this.operationService.createOperation(
      this.pixPaymentOperationChangeTransactionTag,
      operation,
      ownerWallet,
    );
  }

  private async createAndAcceptOperationP2P(
    payment: Payment,
    ownerWallet: Wallet,
    beneficiaryWallet: Wallet,
  ) {
    // Create operation with beneficiary
    const operation = new OperationEntity({
      id: payment.operation.id,
      rawValue: payment.value,
      currency: this.currency,
      description: this.pixPaymentOperationDescription,
    });

    await this.operationService.createAndAcceptOperation(
      payment.transactionTag,
      operation,
      ownerWallet,
      beneficiaryWallet,
    );
  }

  private async createAndAcceptChangeOperationP2P(
    payment: Payment,
    ownerWallet: Wallet,
    beneficiaryWallet: Wallet,
  ) {
    // Create changeOperation with beneficiary
    const operation = new OperationEntity({
      id: payment.changeOperation.id,
      rawValue: payment.value,
      currency: this.currency,
      description: this.pixPaymentOperationDescription,
    });

    await this.operationService.createAndAcceptOperation(
      this.pixPaymentOperationChangeTransactionTag,
      operation,
      ownerWallet,
      beneficiaryWallet,
    );
  }
}
