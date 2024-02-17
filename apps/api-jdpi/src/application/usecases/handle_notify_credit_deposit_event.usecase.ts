import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  FailedEntity,
  MissingDataException,
  TranslateService,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import { PixDepositEntity } from '@zro/pix-payments/domain';
import {
  NotifyCreditDeposit,
  NotifyCreditDepositRepository,
  FailedNotifyCreditEntity,
  FailedNotifyCreditRepository,
  NotifyStateType,
  NotifyCreditTransactionType,
} from '@zro/api-jdpi/domain';
import { PixPaymentService } from '@zro/api-jdpi/application';

export class HandleNotifyCreditDepositJdpiEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditDepositRepository NotifyCreditDeposit repository.
   * @param pixPaymentService PixPaymentService service.
   * @param failedNotifyCreditRepository FailedNotifyCredit repository.
   * @param translateService Translate service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditDepositRepository: NotifyCreditDepositRepository,
    private readonly pixPaymentService: PixPaymentService,
    private readonly failedNotifyCreditRepository: FailedNotifyCreditRepository,
    private readonly translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCreditDepositJdpiEventUseCase.name,
    });
  }

  /**
   * Notify Credit deposit and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCreditDeposit): Promise<void> {
    const { externalId } = payload;

    if (!externalId) {
      throw new MissingDataException(['externalId']);
    }

    return this.handleCreditDeposit(payload);
  }

  /**
   * Credit is a deposit. Send receivedDeposit because is a deposit.
   * @param payload NotifyCreditDeposit payload.
   */
  private async handleCreditDeposit(
    payload: NotifyCreditDeposit,
  ): Promise<void> {
    const deposit = new PixDepositEntity({
      id: payload.externalId,
      txId: payload.clientConciliationId,
      endToEndId: payload.endToEndId,
      amount: payload.amount,
      clientBank: new BankEntity({ ispb: payload.clientIspb }),
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      clientDocument: payload.clientDocument,
      clientName: null,
      clientKey: payload.key,
      thirdPartBank: new BankEntity({ ispb: payload.thirdPartIspb }),
      thirdPartBranch: payload.thirdPartBranch,
      thirdPartAccountType: payload.thirdPartAccountType,
      thirdPartAccountNumber: payload.thirdPartAccountNumber,
      thirdPartDocument: payload.thirdPartDocument,
      thirdPartName: payload.thirdPartName,
      description: payload.informationBetweenClients,
      createdAt: payload.createdAt,
      thirdPartKey: null,
    });

    try {
      payload.state = NotifyStateType.READY;
      const result = await this.pixPaymentService.receivePixDeposit(deposit);

      this.logger.debug('Received credit deposit.', { deposit: result });
    } catch (error) {
      payload.state = NotifyStateType.ERROR;

      const message = await this.translateService.translate(
        'default_exceptions',
        error.code,
      );

      // Save failed externalId into FailedNotifyCredit repository.
      const newFailedNotifyCredit = new FailedNotifyCreditEntity({
        id: uuidV4(),
        externalId: payload.externalId,
        failed: new FailedEntity({ code: error.code, message }),
        failedTransactionType: NotifyCreditTransactionType.CREDIT_DEPOSIT,
      });

      await this.failedNotifyCreditRepository.create(newFailedNotifyCredit);

      this.logger.debug('New failed notify credit deposit created.', {
        newFailedNotifyCredit,
      });
    }

    // Save all notify in database
    const creditDeposit =
      await this.notifyCreditDepositRepository.create(payload);

    this.logger.debug('Credit deposit created.', { creditDeposit });
  }
}
