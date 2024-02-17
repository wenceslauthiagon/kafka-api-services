import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  ThresholdDateComparisonType,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  GetPaymentPixPaymentPspRequest,
  GetPaymentPixPaymentPspResponse,
  PixPaymentGateway,
  WarningPixDevolutionEventEmitter,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingWarningPixDevolutionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param translateService Translate service.
   * @param repository WarningPixDevolution repository.
   * @param eventEmitter WarningPixDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    private readonly translateService: TranslateService,
    private readonly repository: WarningPixDevolutionRepository,
    private readonly eventEmitter: WarningPixDevolutionEventEmitter,
    private readonly pspGateway: PixPaymentGateway,
    private readonly updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingWarningPixDevolutionUseCase.name,
    });
  }

  /**
   * Verify all Waiting WarningPixDevolution and check with PSP.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingWarningPixDevolutions =
      await this.repository.getAllByStateAndThresholdDate(
        WarningPixDevolutionState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.BEFORE_THAN,
      );

    this.logger.debug('Waiting warning pix devolutions found.', {
      length: waitingWarningPixDevolutions.length,
    });

    for (const warningPixDevolution of waitingWarningPixDevolutions) {
      const request: GetPaymentPixPaymentPspRequest = {
        id: warningPixDevolution.id,
        endToEndId: warningPixDevolution.endToEndId,
      };

      this.logger.debug(
        'Get waiting warning pix devolution on PSP gateway request.',
        { request },
      );

      let response: GetPaymentPixPaymentPspResponse = null;

      try {
        response = await this.pspGateway.getPayment(request);
      } catch (error) {
        this.logger.error(
          'Error to get warning pix devolution on PSP gateway.',
          error,
        );
      }

      this.logger.debug('Get warning pix devolution on PSP gateway response.', {
        response,
      });

      if (!response) {
        continue;
      }

      switch (response.status) {
        case PaymentStatusType.SETTLED:
          warningPixDevolution.endToEndId = response.endToEndId;
          this.eventEmitter.completedWarningPixDevolution(warningPixDevolution);
          break;
        case PaymentStatusType.PROCESSING:
          break;
        case PaymentStatusType.CHARGEBACK:
          warningPixDevolution.failed =
            await this.translateService.translatePixPaymentFailed(
              response.errorCode,
            );
          warningPixDevolution.chargebackReason = response.reason;
          this.eventEmitter.revertedWarningPixDevolution(warningPixDevolution);
          break;
        default:
          this.logger.error(
            'Warning pix devolution with invalid status on PSP gateway.',
            { response, warningPixDevolution },
          );
      }
    }

    this.logger.debug('Waiting warning pix devolutions checked.', {
      waitingWarningPixDevolutions,
    });
  }
}
