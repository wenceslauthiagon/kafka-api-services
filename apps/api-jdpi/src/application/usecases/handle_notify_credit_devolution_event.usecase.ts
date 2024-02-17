import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  FailedEntity,
  MissingDataException,
  TranslateService,
} from '@zro/common';
import { BankEntity } from '@zro/banking/domain';
import {
  PaymentEntity,
  PixDevolutionReceivedEntity,
} from '@zro/pix-payments/domain';
import {
  NotifyCreditDevolution,
  NotifyCreditDevolutionRepository,
  FailedNotifyCreditEntity,
  FailedNotifyCreditRepository,
  NotifyStateType,
  NotifyCreditTransactionType,
} from '@zro/api-jdpi/domain';
import { PixPaymentService } from '@zro/api-jdpi/application';

export class HandleNotifyCreditDevolutionJdpiEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param notifyCreditDevolutionRepository NotifyCreditDevolution repository.
   * @param pixPaymentService Payment service.
   * @param failedNotifyCreditRepository FailedNotifyCredit repository.
   * @param translateService Translate service.
   */
  constructor(
    private logger: Logger,
    private readonly notifyCreditDevolutionRepository: NotifyCreditDevolutionRepository,
    private readonly pixPaymentService: PixPaymentService,
    private readonly failedNotifyCreditRepository: FailedNotifyCreditRepository,
    private readonly translateService: TranslateService,
  ) {
    this.logger = logger.child({
      context: HandleNotifyCreditDevolutionJdpiEventUseCase.name,
    });
  }

  /**
   * Notify Credit devolution and send to pixPayment.
   *
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(payload: NotifyCreditDevolution): Promise<void> {
    const { externalId } = payload;

    if (!externalId) {
      throw new MissingDataException(['externalId']);
    }

    return this.handleCreditDevolution(payload);
  }

  /**
   * Credit is a devolution. Send receivedDevolution because is a external devolution.
   * @param payload NotifyCreditDevolution payload.
   */
  private async handleCreditDevolution(
    payload: NotifyCreditDevolution,
  ): Promise<void> {
    const devolutionReceived = new PixDevolutionReceivedEntity({
      id: payload.externalId,
      payment: new PaymentEntity({
        endToEndId: payload.originalEndToEndId,
      }),
      endToEndId: payload.devolutionEndToEndId,
      amount: payload.amount,
      clientBank: new BankEntity({ ispb: payload.clientIspb }),
      clientBranch: payload.clientBranch,
      clientAccountNumber: payload.clientAccountNumber,
      clientDocument: payload.clientDocument,
      thirdPartBank: new BankEntity({ ispb: payload.thirdPartIspb }),
      thirdPartBranch: payload.thirdPartBranch,
      thirdPartAccountType: payload.thirdPartAccountType,
      thirdPartAccountNumber: payload.thirdPartAccountNumber,
      thirdPartDocument: payload.thirdPartDocument,
      thirdPartName: payload.thirdPartName,
      description: payload.devolutionReason,
      createdAt: payload.createdAt,
    });

    try {
      payload.state = NotifyStateType.READY;

      const result =
        await this.pixPaymentService.receivePixDevolution(devolutionReceived);

      this.logger.debug('Received devolution created.', {
        devolutionReceived: result,
      });
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
        failedTransactionType: NotifyCreditTransactionType.CREDIT_DEVOLUTION,
      });

      await this.failedNotifyCreditRepository.create(newFailedNotifyCredit);

      this.logger.debug('Created new failed notify credit devolution.', {
        newFailedNotifyCredit,
      });
    }

    // Save all notify in database
    const creditDevolution =
      await this.notifyCreditDevolutionRepository.create(payload);

    this.logger.debug('Credit devolution created.', { creditDevolution });
  }
}
