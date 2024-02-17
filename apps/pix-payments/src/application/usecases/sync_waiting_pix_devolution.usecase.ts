import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  PixDevolutionRepository,
  PixDevolutionState,
  ThresholdDateComparisonType,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  PixDevolutionEventEmitter,
  GetPaymentPixPaymentPspRequest,
  PixPaymentGateway,
  GetPaymentPixPaymentPspResponse,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingPixDevolutionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param translateService Translate service.
   * @param repository PixDevolution repository.
   * @param eventEmitter PixDevolution event emitter.
   * @param pspGateway PSP gateway instance.
   * @param updatedAtThresholdInSeconds UpdatedAt threshold in seconds.
   */
  constructor(
    private logger: Logger,
    private readonly translateService: TranslateService,
    private readonly repository: PixDevolutionRepository,
    private readonly eventEmitter: PixDevolutionEventEmitter,
    private readonly pspGateway: PixPaymentGateway,
    private readonly updatedAtThresholdInSeconds: number,
  ) {
    this.logger = logger.child({
      context: SyncWaitingPixDevolutionUseCase.name,
    });
  }

  /**
   * Verify all Waiting PixDevolutions and check with PSP.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingPixDevolutions =
      await this.repository.getAllByStateAndThresholdDate(
        PixDevolutionState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.BEFORE_THAN,
      );

    this.logger.debug('Waiting pix devolutions found.', {
      length: waitingPixDevolutions.length,
    });

    for (const pixDevolution of waitingPixDevolutions) {
      const request: GetPaymentPixPaymentPspRequest = {
        id: pixDevolution.id,
        endToEndId: pixDevolution.endToEndId,
      };

      this.logger.debug('Get pix devolution on PSP gateway request.', {
        request,
      });

      let response: GetPaymentPixPaymentPspResponse = null;
      try {
        response = await this.pspGateway.getPayment(request);
      } catch (error) {
        this.logger.error('Error to get pix devolution on PSPGateway.', error);
      }

      this.logger.debug('Get pix devolution on PSP gateway response.', {
        response,
      });

      if (!response) {
        continue;
      }

      switch (response.status) {
        case PaymentStatusType.SETTLED:
          pixDevolution.endToEndId = response.endToEndId;
          this.eventEmitter.completedDevolution(pixDevolution);
          break;
        case PaymentStatusType.PROCESSING:
          break;
        case PaymentStatusType.CHARGEBACK:
          pixDevolution.failed =
            await this.translateService.translatePixPaymentFailed(
              response.errorCode,
            );
          pixDevolution.chargebackReason = response.reason;
          this.eventEmitter.revertedDevolution(pixDevolution);
          break;
        default:
          this.logger.error(
            'Pix devolution with invalid status on PSP gateway.',
            { response, pixDevolution },
          );
      }
    }

    this.logger.debug('Waiting pix devolutions checked.', {
      waitingPixDevolutions,
    });
  }
}
