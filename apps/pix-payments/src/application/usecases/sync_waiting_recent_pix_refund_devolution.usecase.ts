import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  GetPaymentByIdPixPaymentPspRequest,
  GetPaymentByIdPixPaymentPspResponse,
  PixPaymentGateway,
  PixRefundDevolutionEventEmitter,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingRecentPixRefundDevolutionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param translateService Translate service.
   * @param repository PixRefundDevolution repository.
   * @param eventEmitter PixRefundDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    private readonly translateService: TranslateService,
    private readonly repository: PixRefundDevolutionRepository,
    private readonly eventEmitter: PixRefundDevolutionEventEmitter,
    private readonly pspGateway: PixPaymentGateway,
    private readonly updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingRecentPixRefundDevolutionUseCase.name,
    });
  }

  /**
   * Verify all primary priority waiting pix refund devolution
   * that have been updated after or equal a defined threshold date.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingRecentPixRefundDevolutions =
      await this.repository.getAllByStateAndThresholdDate(
        PixRefundDevolutionState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.AFTER_OR_EQUAL_THAN,
      );

    this.logger.debug('Waiting recent pix refund devolutions found.', {
      length: waitingRecentPixRefundDevolutions.length,
    });

    for (const pixRefundDevolution of waitingRecentPixRefundDevolutions) {
      const request: GetPaymentByIdPixPaymentPspRequest = {
        id: pixRefundDevolution.id,
        externalId: pixRefundDevolution.externalId,
      };

      this.logger.debug(
        'Get waiting recent pix refund devolution by ID on PSP gateway request.',
        { request },
      );

      let response: GetPaymentByIdPixPaymentPspResponse = null;

      try {
        response = await this.pspGateway.getPaymentById(request);
      } catch (error) {
        this.logger.error(
          'Error to get waiting recent pix refund devolution by ID on PSP gateway.',
          error,
        );
      }

      this.logger.debug(
        'Get waiting recent pix refund devolution by ID on PSP gateway response.',
        { response },
      );

      if (!response) {
        continue;
      }

      switch (response.status) {
        case PaymentStatusType.SETTLED:
          pixRefundDevolution.endToEndId = response.endToEndId;
          this.eventEmitter.completedRefundDevolution(pixRefundDevolution);
          break;
        case PaymentStatusType.PROCESSING:
          break;
        case PaymentStatusType.CHARGEBACK:
          pixRefundDevolution.failed =
            await this.translateService.translatePixPaymentFailed(
              response.errorCode,
            );
          pixRefundDevolution.chargebackReason = response.reason;
          this.eventEmitter.revertedRefundDevolution(pixRefundDevolution);
          break;
        default:
          this.logger.error(
            'Waiting recent pix refund devolution with invalid status on PSP gateway.',
            { response, pixRefundDevolution },
          );
      }
    }

    this.logger.debug(
      'All waiting recent pix refund devolution have been checked.',
      {
        waitingRecentPixRefundDevolutions,
      },
    );
  }
}
