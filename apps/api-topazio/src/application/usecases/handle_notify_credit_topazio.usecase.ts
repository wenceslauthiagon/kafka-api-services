import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { isDefined } from 'class-validator';
import {
  FailedEntity,
  MissingDataException,
  TranslateService,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PaymentEntity,
  PixDepositEntity,
  PixDevolutionEntity,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import {
  NotifyStateType,
  NotifyCredit,
  NotifyCreditRepository,
  TransactionType,
  FailedNotifyCreditRepository,
  FailedNotifyCreditEntity,
} from '@zro/api-topazio/domain';
import {
  PixPaymentService,
  NotifyInvalidStatusException,
  NotifyInvalidtransactionTypeException,
} from '@zro/api-topazio/application';

export class HandleNotifyCreditTopazioEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditRepository repository.
   * @param pixPaymentService Payment service.
   * @param failedNotifyCreditRepository Failed notify credit repository.
   * @param translateService Translate service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditRepository: NotifyCreditRepository,
    private readonly pixPaymentService: PixPaymentService,
    private readonly failedNotifyCreditRepository: FailedNotifyCreditRepository,
    private readonly translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCreditTopazioEventUseCase.name,
    });
  }

  /**
   * Notify Credit and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCredit): Promise<void> {
    const { transactionId } = payload;

    if (!transactionId) {
      throw new MissingDataException(['Transaction ID']);
    }

    const { isDevolution, status, transactionType } = payload;
    if (!status || !isDefined(isDevolution) || !transactionType) {
      throw new MissingDataException([
        ...(!status ? ['Status'] : []),
        ...(!isDefined(isDevolution) ? ['Devolution'] : []),
        ...(!transactionType ? ['Transaction Type'] : []),
      ]);
    }

    if (!payload.isValidStatus()) {
      throw new NotifyInvalidStatusException(status);
    }

    if (!payload.isValidTransactionType()) {
      throw new NotifyInvalidtransactionTypeException(transactionType);
    }

    // Save all notify in database
    payload.state = NotifyStateType.READY;
    await this.notifyCreditRepository.create(payload);

    if (transactionType === TransactionType.CREDIT) {
      if (isDevolution) {
        return this.handleDevolutionCredit(payload);
      }

      return this.handleDepositCredit(payload);
    }

    if (transactionType === TransactionType.CHARGEBACK) {
      if (isDevolution) {
        return this.handleDevolutionChargeback(payload);
      }

      return this.handlePaymentChargeback(payload);
    }
  }

  /**
   * Credit is not a devolution. Send receivedDeposit because is a deposit.
   * @param payload The notify credit payload
   */
  private async handleDepositCredit(payload: NotifyCredit): Promise<void> {
    const deposit = new PixDepositEntity({
      id: payload.transactionId,
      txId: payload.txId,
      endToEndId: payload.endToEndId,
      amount: payload.amount,
      clientBank: new BankEntity({ ispb: payload.clientIspb }),
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      clientDocument: payload.clientDocument,
      clientName: payload.clientName,
      clientKey: payload.clientKey,
      thirdPartBank: new BankEntity({ ispb: payload.thirdPartIspb }),
      thirdPartBranch: payload.thirdPartBranch,
      thirdPartAccountType: payload.thirdPartAccountType,
      thirdPartAccountNumber: payload.thirdPartAccountNumber,
      thirdPartDocument: payload.thirdPartDocument,
      thirdPartName: payload.thirdPartName,
      thirdPartKey: payload.thirdPartKey,
      description: payload.description,
    });

    try {
      const result = await this.pixPaymentService.receivePixDeposit(deposit);

      this.logger.debug('Received deposit created.', { deposit: result });
    } catch (error) {
      const message = await this.translateService.translate(
        'default_exceptions',
        error.code,
      );

      // Save failed transaction ID into FailedNotifyCredit repository.
      const newFailedNotifyCredit = new FailedNotifyCreditEntity({
        id: uuidV4(),
        transactionId: payload.transactionId,
        failed: new FailedEntity({
          code: error.code,
          message,
        }),
      });

      await this.failedNotifyCreditRepository.create(newFailedNotifyCredit);

      this.logger.debug('Created new failed notify credit.', {
        newFailedNotifyCredit,
      });
    }
  }

  /**
   * Credit is a devolution. Send receivedDevolution because is a external devolution.
   * @param payload The notify credit payload
   */
  private async handleDevolutionCredit(payload: NotifyCredit): Promise<void> {
    const devolutionReceived = new PixDevolutionReceivedEntity({
      id: payload.transactionId,
      txId: payload.txId,
      endToEndId: payload.endToEndId,
      amount: payload.amount,
      payment: new PaymentEntity({ id: payload.transactionOriginalID }),
      clientBank: new BankEntity({ ispb: payload.clientIspb }),
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      clientDocument: payload.clientDocument,
      clientName: payload.clientName,
      clientKey: payload.clientKey,
      thirdPartBank: new BankEntity({ ispb: payload.thirdPartIspb }),
      thirdPartBranch: payload.thirdPartBranch,
      thirdPartAccountType: payload.thirdPartAccountType,
      thirdPartAccountNumber: payload.thirdPartAccountNumber,
      thirdPartDocument: payload.thirdPartDocument,
      thirdPartName: payload.thirdPartName,
      thirdPartKey: payload.thirdPartKey,
      description: payload.description,
    });

    try {
      const result =
        await this.pixPaymentService.receivePixDevolution(devolutionReceived);

      this.logger.debug('Received devolution created.', {
        devolutionReceived: result,
      });
    } catch (error) {
      const message = await this.translateService.translate(
        'default_exceptions',
        error.code,
      );

      // Save failed transaction ID into FailedNotifyCredit repository.
      const newFailedNotifyCredit = new FailedNotifyCreditEntity({
        id: uuidV4(),
        transactionId: payload.transactionId,
        failed: new FailedEntity({
          code: error.code,
          message,
        }),
      });

      await this.failedNotifyCreditRepository.create(newFailedNotifyCredit);

      this.logger.debug('Created new failed notify credit.', {
        newFailedNotifyCredit,
      });
    }
  }

  /**
   * Chargeback is not a devolution. Send receivedPaymentChargeback.
   * @param payload The notify credit payload
   */
  private async handlePaymentChargeback(payload: NotifyCredit): Promise<void> {
    const payment = new PaymentEntity({
      id: payload.transactionOriginalID,
      chargebackReason: payload.reason,
    });

    const result =
      await this.pixPaymentService.receivePixPaymentChargeback(payment);

    this.logger.debug('Received payment chargeback.', {
      payment: result,
    });
  }

  /**
   * Chargeback is a devolution. Send receivedDevolutionChargeback.
   * @param payload The notify credit payload
   */
  private async handleDevolutionChargeback(
    payload: NotifyCredit,
  ): Promise<void> {
    const devolution = new PixDevolutionEntity({
      id: payload.transactionOriginalID,
      chargebackReason: payload.reason,
    });

    const result =
      await this.pixPaymentService.receivePixDevolutionChargeback(devolution);

    this.logger.debug('Received devolution chargeback.', {
      devolution: result,
    });
  }
}
