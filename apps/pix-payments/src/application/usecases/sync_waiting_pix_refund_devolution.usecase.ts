import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  GetPaymentPixPaymentPspRequest,
  GetPaymentPixPaymentPspResponse,
  PixPaymentGateway,
  PixRefundDevolutionEventEmitter,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingPixRefundDevolutionUseCase {
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
      context: SyncWaitingPixRefundDevolutionUseCase.name,
    });
  }

  /**
   * Verify all Waiting PixRefundDevolution and check with PSP.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingPixRefundDevolutions =
      await this.repository.getAllByStateAndThresholdDate(
        PixRefundDevolutionState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.BEFORE_THAN,
      );

    this.logger.debug('Waiting pix refund devolutions found.', {
      length: waitingPixRefundDevolutions.length,
    });

    for (const pixRefundDevolution of waitingPixRefundDevolutions) {
      const request: GetPaymentPixPaymentPspRequest = {
        id: pixRefundDevolution.id,
        endToEndId: pixRefundDevolution.endToEndId,
      };

      this.logger.debug('Get pix refund devolution on PSP gateway request.', {
        request,
      });

      let response: GetPaymentPixPaymentPspResponse = null;

      try {
        response = await this.pspGateway.getPayment(request);
      } catch (error) {
        this.logger.error(
          'Error to get pix refund devolution on PSP gateway.',
          error,
        );
      }

      this.logger.debug('Get Pix refund devolution on PSP gateway response.', {
        response,
      });

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
            'Pix refund devolution with invalid status on PSPGateway.',
            { response, pixRefundDevolution },
          );
      }
    }

    this.logger.debug('Waiting pix refund devolutions checked.', {
      waitingPixRefundDevolutions,
    });
  }
}
