import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  PaymentRepository,
  PaymentState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  PaymentEventEmitter,
  PixPaymentGateway,
  GetPaymentPixPaymentPspRequest,
  GetPaymentPixPaymentPspResponse,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingPaymentUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param translateService Translate service.
   * @param repository PixPayment repository.
   * @param eventEmitter PixPayment event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    private readonly translateService: TranslateService,
    private readonly repository: PaymentRepository,
    private readonly eventEmitter: PaymentEventEmitter,
    private readonly pspGateway: PixPaymentGateway,
    private readonly updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({ context: SyncWaitingPaymentUseCase.name });
  }

  /**
   * Verify all Waiting Payments and check with PSP.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingPayments =
      await this.repository.getAllByStateThresholdDateAndPriorityType(
        PaymentState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.BEFORE_THAN,
      );

    this.logger.debug('Waiting pix payments found.', {
      length: waitingPayments.length,
    });

    for (const payment of waitingPayments) {
      const request: GetPaymentPixPaymentPspRequest = {
        id: payment.id,
        endToEndId: payment.endToEndId,
      };

      this.logger.debug('Get payment on PSP gateway request.', { request });

      let response: GetPaymentPixPaymentPspResponse = null;
      try {
        response = await this.pspGateway.getPayment(request);
      } catch (error) {
        this.logger.error('Error to get payment on PSPGateway.', error);
      }

      this.logger.debug('Get payment on PSP gateway response.', { response });

      if (!response) {
        continue;
      }

      switch (response.status) {
        case PaymentStatusType.SETTLED:
          payment.endToEndId = response.endToEndId;
          this.eventEmitter.completedPayment(payment);
          break;
        case PaymentStatusType.PROCESSING:
          break;
        case PaymentStatusType.CHARGEBACK:
          payment.failed =
            await this.translateService.translatePixPaymentFailed(
              response.errorCode,
            );
          payment.chargebackReason = response.reason;
          this.eventEmitter.revertedPayment(payment);
          break;
        default:
          this.logger.error('Payment with invalid status on PSPGateway.', {
            response,
            payment,
          });
      }
    }

    this.logger.debug('Waiting payments checked.', { waitingPayments });
  }
}
