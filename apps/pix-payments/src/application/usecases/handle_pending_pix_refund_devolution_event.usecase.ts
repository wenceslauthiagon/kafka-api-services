import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  CurrencyEntity,
  OperationEntity,
  Wallet,
} from '@zro/operations/domain';
import {
  PixDepositRepository,
  PixRefundDevolution,
  PixDevolutionReceivedRepository,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundTransaction,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionNotFoundException,
  PixRefundDevolutionInvalidStateException,
  OperationService,
  PixRefundDevolutionEventEmitter,
  PixPaymentGateway,
  CreatePixDevolutionRefundPixPaymentPspRequest,
  PixTransactionNotFoundException,
  PixRefundTransactionZroAccountNotExistsException,
} from '@zro/pix-payments/application';
import { WalletAccountNotActiveException } from '@zro/operations/application';

export class HandlePendingPixRefundDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param refundDevolutionRepository devolution repository.
   * @param depositRepository deposit repository.
   * @param pspGateway PSP gateway instance.
   * @param eventEmitter devolution event emitter.
   * @param operationService Operation service gateway.
   */
  constructor(
    private logger: Logger,
    private readonly refundDevolutionRepository: PixRefundDevolutionRepository,
    private readonly depositRepository: PixDepositRepository,
    private readonly pspGateway: PixPaymentGateway,
    private readonly eventEmitter: PixRefundDevolutionEventEmitter,
    private readonly operationService: OperationService,
    private readonly devolutionReceivedRepository: PixDevolutionReceivedRepository,
    private readonly pixSendRefundDevolutionOperationCurrencyTag: string,
    private readonly pixSendRefundDevolutionOperationTransactionTag: string,
    private readonly pixDevolutionZroBankIspb: string,
  ) {
    this.logger = logger.child({
      context: HandlePendingPixRefundDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when refundDevolution is pending.
   * In refundDevolution case, the owner is the thirdPart, and beneficiary is the client.
   *
   * @param id refundDevolution id id.
   * @returns Devolution created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {DevolutionNotFoundException} Thrown when devolution id was not found.
   * @throws {DevolutionInvalidStateException} Thrown when devolution state is not pending.
   */
  async execute(id: string): Promise<PixRefundDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search devolution
    const refundDevolution = await this.refundDevolutionRepository.getById(id);

    this.logger.debug('Found devolution.', { refundDevolution });

    if (!refundDevolution) {
      throw new PixRefundDevolutionNotFoundException({ id });
    }

    // Check indepotent
    if (
      [
        PixRefundDevolutionState.WAITING,
        PixRefundDevolutionState.CONFIRMED,
      ].includes(refundDevolution.state)
    ) {
      return refundDevolution;
    }

    // Only PENDING devolution is accept.
    if (refundDevolution.state !== PixRefundDevolutionState.PENDING) {
      throw new PixRefundDevolutionInvalidStateException(refundDevolution);
    }

    // Search originalTransaction
    const devolutionReceived = await this.devolutionReceivedRepository.getById(
      refundDevolution.transaction.id,
    );
    const deposit = await this.depositRepository.getById(
      refundDevolution.transaction.id,
    );

    this.logger.debug('Check if devolution or deposit exists.', {
      devolutionReceived,
      deposit,
    });

    if (!devolutionReceived && !deposit) {
      throw new PixTransactionNotFoundException({
        endToEndId: refundDevolution.transaction.id,
      });
    }

    const transactionFound: PixRefundTransaction =
      deposit || devolutionReceived;

    refundDevolution.transaction = transactionFound;

    // Check if transaction owner's account is zrobank
    if (
      !transactionFound.thirdPartBank.isSameIspb(this.pixDevolutionZroBankIspb)
    ) {
      // Beneficiary is not zroBank, send devolution PSP
      return this.sendDevolutionPSP(refundDevolution);
    }

    const walletAccount =
      await this.operationService.getWalletAccountByAccountNumberAndCurrency(
        transactionFound.thirdPartAccountNumber,
        new CurrencyEntity({
          tag: this.pixSendRefundDevolutionOperationCurrencyTag,
        }),
      );

    this.logger.debug('WalletAccount by thirdPartAccountNumber found.', {
      walletAccount,
    });

    // Check if beneficiary account is zrobank
    if (!walletAccount) {
      throw new PixRefundTransactionZroAccountNotExistsException(
        transactionFound,
      );
    }
    if (!walletAccount.isActive()) {
      throw new WalletAccountNotActiveException(walletAccount);
    }

    // Beneficiary is zroBank, send devolution for zro
    return this.sendDevolutionP2P(refundDevolution, transactionFound.wallet);
  }

  /**
   * @param devolution
   * @returns refundDevolution
   */
  private async sendDevolutionPSP(
    refundDevolution: PixRefundDevolution,
  ): Promise<PixRefundDevolution> {
    this.logger.debug('Preparing devolution for send to PSP.', {
      refundDevolution,
    });

    const body: CreatePixDevolutionRefundPixPaymentPspRequest = {
      devolutionId: refundDevolution.id,
      depositId: refundDevolution.transaction.id,
      depositEndToEndId: refundDevolution.transaction.endToEndId,
      amount: refundDevolution.amount,
      description: refundDevolution.description,
      devolutionCode: refundDevolution.devolutionCode,
    };

    this.logger.debug('Create pix refund devolution on PSP request.', {
      request: body,
    });

    const pspResult = await this.pspGateway.createPixDevolutionRefund(body);

    this.logger.debug('Create pix refund devolution on PSP response.', {
      response: pspResult,
    });

    refundDevolution.endToEndId = pspResult.endToEndId;
    refundDevolution.state = PixRefundDevolutionState.WAITING;
    refundDevolution.externalId = pspResult.externalId;

    // Update refundDevolution
    await this.refundDevolutionRepository.update(refundDevolution);

    // Fire WaitingDevolution
    this.eventEmitter.waitingRefundDevolution(refundDevolution);

    this.logger.debug('Updated devolution with waiting status.', {
      refundDevolution,
    });

    return refundDevolution;
  }

  /**
   * @param refundDevolution
   * @param beneficiaryWallet Wallet beneficiary Zrobank
   * @returns RefundDevolution
   */
  private async sendDevolutionP2P(
    refundDevolution: PixRefundDevolution,
    beneficiaryWallet: Wallet,
  ): Promise<PixRefundDevolution> {
    this.logger.debug('Preparing refundDevolution for send to P2P.', {
      refundDevolution,
    });

    // Create operation beneficiary
    const operation = new OperationEntity({
      id: refundDevolution.operation.id,
      rawValue: refundDevolution.amount,
      currency: new CurrencyEntity({
        tag: this.pixSendRefundDevolutionOperationCurrencyTag,
      }),
      description: this.pixSendRefundDevolutionOperationTransactionTag,
    });

    await this.operationService.createAndAcceptOperation(
      this.pixSendRefundDevolutionOperationTransactionTag,
      operation,
      null,
      beneficiaryWallet,
    );

    this.logger.debug('Accepted refundDevolution for beneficiary ZroBank.', {
      refundDevolution,
    });

    refundDevolution.state = PixRefundDevolutionState.CONFIRMED;

    // Update refundDevolution
    await this.refundDevolutionRepository.update(refundDevolution);

    // Fire ConfirmedDevolution
    this.eventEmitter.confirmedRefundDevolution(refundDevolution);

    this.logger.debug('Updated devolution with confirmed status.', {
      refundDevolution,
    });

    return refundDevolution;
  }
}
