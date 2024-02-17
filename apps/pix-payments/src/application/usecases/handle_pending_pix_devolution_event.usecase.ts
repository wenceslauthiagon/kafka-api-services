import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { isCpf, MissingDataException } from '@zro/common';
import { PersonDocumentType } from '@zro/users/domain';
import {
  Currency,
  CurrencyEntity,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  AccountType,
  PaymentRepository,
  PixDeposit,
  PixDepositRepository,
  PixDevolution,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedRepository,
  PixDevolutionReceivedState,
  PixDevolutionRepository,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDepositNotFoundException,
  PixDevolutionNotFoundException,
  PixDevolutionInvalidStateException,
  OperationService,
  PixDevolutionEventEmitter,
  PixPaymentGateway,
  CreatePixDevolutionPixPaymentPspRequest,
  PixDepositZroAccountNotExistsException,
  PixDevolutionReceivedEventEmitter,
  PaymentNotFoundException,
} from '@zro/pix-payments/application';
import { WalletAccountNotActiveException } from '@zro/operations/application';

export class HandlePendingPixDevolutionEventUseCase {
  private readonly currency: Currency;

  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param devolutionRepository devolution repository.
   * @param depositRepository deposit repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter devolution event emitter.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly devolutionRepository: PixDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly eventEmitter: PixDevolutionEventEmitter,
    private readonly operationService: OperationService,
    private readonly paymentRepository: PaymentRepository,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly devolutionReceivedEventEmitter: PixDevolutionReceivedEventEmitter,
    private readonly pixSendDevolutionOperationCurrencyTag: string,
    private readonly pixSendDevolutionOperationTransactionTag: string,
    private readonly pixDevolutionZroBankIspb: string,
    private readonly pixDevolutionReceivedOperationTransactionTag: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingPixDevolutionEventUseCase.name,
    });

    this.currency = new CurrencyEntity({
      tag: this.pixSendDevolutionOperationCurrencyTag,
    });
  }

  /**
   * Handler triggered when devolution is pending.
   * In devolution case, the owner is the thirdPart, and beneficiary is the client.
   *
   * @param id devolution id.
   * @returns Devolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {DevolutionNotFoundException} Thrown when devolution id was not found.
   * @throws {DevolutionInvalidStateException} Thrown when devolution state is not pending.
   */
  async execute(id: string): Promise<PixDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search devolution
    const devolution = await this.devolutionRepository.getById(id);

    this.logger.debug('Found devolution.', { devolution });

    if (!devolution) {
      throw new PixDevolutionNotFoundException({ id });
    }

    // Check indepotent
    if (
      [PixDevolutionState.WAITING, PixDevolutionState.CONFIRMED].includes(
        devolution.state,
      )
    ) {
      return devolution;
    }

    // Only PENDING devolution is accept.
    if (devolution.state !== PixDevolutionState.PENDING) {
      throw new PixDevolutionInvalidStateException(devolution);
    }

    // Search deposit
    const deposit = await this.depositRepository.getById(devolution.deposit.id);

    this.logger.debug('Deposit found.', { deposit });

    if (!deposit) {
      throw new PixDepositNotFoundException({ id: devolution.deposit.id });
    }

    // Check if deposit owner's account is zrobank
    if (!deposit.thirdPartBank.isSameIspb(this.pixDevolutionZroBankIspb)) {
      // Beneficiary is not zroBank, send devolution PSP
      return this.sendDevolutionPSP(devolution, deposit);
    }

    const beneficiaryWalletAccount =
      await this.operationService.getWalletAccountByAccountNumberAndCurrency(
        deposit.thirdPartAccountNumber,
        this.currency,
      );

    this.logger.debug('WalletAccount by thirdPartAccountNumber found.', {
      beneficiaryWalletAccount,
    });

    // Check if beneficiary account is zrobank
    if (!beneficiaryWalletAccount) {
      throw new PixDepositZroAccountNotExistsException(deposit);
    }
    if (!beneficiaryWalletAccount.isActive()) {
      throw new WalletAccountNotActiveException(beneficiaryWalletAccount);
    }

    // Beneficiary is zroBank, send devolution for zro
    return this.sendDevolutionP2P(
      devolution,
      deposit,
      devolution.wallet,
      beneficiaryWalletAccount.wallet,
    );
  }

  /**
   * @param devolution
   * @returns devolution
   */
  private async sendDevolutionPSP(
    devolution: PixDevolution,
    deposit: PixDeposit,
  ): Promise<PixDevolution> {
    this.logger.debug('Preparing devolution for send to PSP.', { devolution });

    // Create operation without beneficiary
    const operation = new OperationEntity({
      id: devolution.operation.id,
      rawValue: devolution.amount,
      currency: this.currency,
      description: this.pixSendDevolutionOperationTransactionTag,
    });

    await this.operationService.createOperation(
      this.pixSendDevolutionOperationTransactionTag,
      operation,
      devolution.wallet,
    );

    const body: CreatePixDevolutionPixPaymentPspRequest = {
      devolutionId: devolution.id,
      depositId: deposit.id,
      depositEndToEndId: deposit.endToEndId,
      amount: devolution.amount,
      description: devolution.description,
      devolutionCode: devolution.devolutionCode,
    };

    this.logger.debug('Create pix devolution on PSP request.', {
      request: body,
    });

    const pspResult = await this.pspGateway.createPixDevolution(body);

    this.logger.info('Create pix devolution on PSP response.', {
      response: pspResult,
    });

    // Devolution is waiting.
    devolution.endToEndId = pspResult.endToEndId;
    devolution.state = PixDevolutionState.WAITING;
    devolution.externalId = pspResult.externalId;

    // Update devolution
    await this.devolutionRepository.update(devolution);

    // Fire WaitingDevolution
    this.eventEmitter.waitingDevolution(devolution);

    this.logger.debug('Updated devolution with waiting status.', {
      devolution,
    });

    return devolution;
  }

  /**
   * @param devolution
   * @param ownerWallet Wallet owner Zrobank
   * @param beneficiaryWallet Wallet beneficiary Zrobank
   * @returns devolution
   */
  private async sendDevolutionP2P(
    devolution: PixDevolution,
    deposit: PixDeposit,
    ownerWallet: Wallet,
    beneficiaryWallet: Wallet,
  ): Promise<PixDevolution> {
    this.logger.debug('Preparing devolution for send to P2P.', { devolution });

    const payment = await this.paymentRepository.getByOperation(
      deposit.operation,
    );

    if (!payment) {
      throw new PaymentNotFoundException({ operation: deposit.operation });
    }

    // Create operation with beneficiary
    const operation = new OperationEntity({
      id: devolution.operation.id,
      rawValue: devolution.amount,
      currency: this.currency,
      description: this.pixSendDevolutionOperationTransactionTag,
    });

    await this.operationService.createAndAcceptOperation(
      this.pixSendDevolutionOperationTransactionTag,
      operation,
      ownerWallet,
      beneficiaryWallet,
    );

    this.logger.debug('Accepted devolution for beneficiary ZroBank.', {
      devolution,
    });

    // Create devolutionReceived for beneficiary with devolutionData
    const devolutionReceived = new PixDevolutionReceivedEntity({
      id: uuidV4(),
      state: PixDevolutionReceivedState.READY,
      operation: new OperationEntity({ id: devolution.operation.id }),
      user: beneficiaryWallet.user,
      wallet: beneficiaryWallet,
      payment,
      txId: deposit.txId,
      endToEndId: deposit.endToEndId,
      amount: devolution.amount,
      clientBank: deposit.thirdPartBank,
      clientBranch: deposit.thirdPartBranch,
      clientAccountNumber: deposit.thirdPartAccountNumber,
      clientPersonType: isCpf(deposit.thirdPartDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      clientDocument: deposit.thirdPartDocument,
      clientName: deposit.thirdPartName,
      clientKey: deposit.thirdPartKey,
      thirdPartBank: deposit.clientBank,
      thirdPartBranch: deposit.clientBranch,
      thirdPartAccountType: AccountType.CACC,
      thirdPartAccountNumber: deposit.clientAccountNumber,
      thirdPartPersonType: isCpf(deposit.clientDocument)
        ? PersonDocumentType.CPF
        : PersonDocumentType.CNPJ,
      thirdPartDocument: deposit.clientDocument,
      thirdPartName: deposit.clientName,
      thirdPartKey: deposit.clientKey,
      description: devolution.description,
      transactionTag: this.pixDevolutionReceivedOperationTransactionTag,
    });

    // Create devolutionReceived
    const newDeposit =
      await this.devolutionReceivedRepository.create(devolutionReceived);

    // Fire received pix devolutionReceived
    this.devolutionReceivedEventEmitter.readyDevolutionReceived({
      ...devolutionReceived,
      refundOperationId: uuidV4(),
    });

    this.logger.debug('Added deposit with payment data.', {
      deposit: newDeposit,
    });

    devolution.state = PixDevolutionState.CONFIRMED;

    // Update devolution
    await this.devolutionRepository.update(devolution);

    // Fire ConfirmedDevolution
    devolution.deposit = deposit;
    this.eventEmitter.confirmedDevolution({
      transactionTag: this.pixSendDevolutionOperationTransactionTag,
      ...devolution,
    });

    this.logger.debug('Updated devolution with confirmed status.', {
      devolution,
    });

    return devolution;
  }
}
