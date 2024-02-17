import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  PaymentPriorityType,
  PaymentRepository,
  PaymentState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  PaymentEventEmitter,
  PixPaymentGateway,
  GetPaymentByIdPixPaymentPspResponse,
  TranslateService,
  GetPaymentByIdPixPaymentPspRequest,
} from '@zro/pix-payments/application';

export class SyncWaitingRecentPaymentUseCase {
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
    this.logger = logger.child({
      context: SyncWaitingRecentPaymentUseCase.name,
    });
  }

  /**
   * Verify all primary priority waiting pix payment
   * that have been updated after or equal a defined threshold date.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingRecentPayments =
      await this.repository.getAllByStateThresholdDateAndPriorityType(
        PaymentState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.AFTER_OR_EQUAL_THAN,
        PaymentPriorityType.PRIORITY,
      );

    this.logger.debug('Waiting recent pix payments found.', {
      length: waitingRecentPayments.length,
    });

    for (const payment of waitingRecentPayments) {
      const request: GetPaymentByIdPixPaymentPspRequest = {
        id: payment.id,
        externalId: payment.externalId,
      };

      this.logger.debug(
        'Get waiting recent pix payment by ID on PSP gateway request.',
        { request },
      );

      let response: GetPaymentByIdPixPaymentPspResponse = null;
      try {
        response = await this.pspGateway.getPaymentById(request);
      } catch (error) {
        this.logger.error(
          'Error to get waiting recent pix payment by ID on PSP gateway.',
          error,
        );
      }

      this.logger.debug(
        'Get waiting recent pix payment by ID on PSP gateway response.',
        { response },
      );

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
          this.logger.error(
            'Waiting recent pix payment with invalid status on PSP gateway.',
            {
              response,
              payment,
            },
          );
      }
    }

    this.logger.debug('All waiting recent pix payment have been checked.', {
      waitingRecentPayments,
    });
  }
}
