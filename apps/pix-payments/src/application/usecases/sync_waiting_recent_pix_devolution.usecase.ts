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
  PixPaymentGateway,
  GetPaymentByIdPixPaymentPspResponse,
  GetPaymentByIdPixPaymentPspRequest,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingRecentPixDevolutionUseCase {
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
      context: SyncWaitingRecentPixDevolutionUseCase.name,
    });
  }

  /**
   * Verify all primary priority waiting pix devolution
   * that have been updated after or equal a defined threshold date.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingRecentPixDevolutions =
      await this.repository.getAllByStateAndThresholdDate(
        PixDevolutionState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.AFTER_OR_EQUAL_THAN,
      );

    this.logger.debug('Waiting recent pix devolutions found.', {
      length: waitingRecentPixDevolutions.length,
    });

    for (const pixDevolution of waitingRecentPixDevolutions) {
      const request: GetPaymentByIdPixPaymentPspRequest = {
        id: pixDevolution.id,
        externalId: pixDevolution.externalId,
      };

      this.logger.debug(
        'Get waiting recent pix devolution by ID on PSP gateway request.',
        { request },
      );

      let response: GetPaymentByIdPixPaymentPspResponse = null;
      try {
        response = await this.pspGateway.getPaymentById(request);
      } catch (error) {
        this.logger.error(
          'Error to get waiting recent pix devolution by ID on PSP gateway.',
          error,
        );
      }

      this.logger.debug(
        'Get waiting recent pix devolution by ID on PSP gateway response.',
        { response },
      );

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
            'Waiting recent pix devolution with invalid status on PSP gateway.',
            { response, pixDevolution },
          );
      }
    }

    this.logger.debug('All waiting recent pix devolution have been checked.', {
      waitingRecentPixDevolutions,
    });
  }
}
