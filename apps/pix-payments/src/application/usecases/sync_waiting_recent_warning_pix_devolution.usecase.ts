import { Logger } from 'winston';
import { getMoment } from '@zro/common';
import {
  ThresholdDateComparisonType,
  WarningPixDevolutionRepository,
  WarningPixDevolutionState,
} from '@zro/pix-payments/domain';
import { PaymentStatusType } from '@zro/api-topazio/domain';
import {
  GetPaymentByIdPixPaymentPspRequest,
  GetPaymentByIdPixPaymentPspResponse,
  PixPaymentGateway,
  WarningPixDevolutionEventEmitter,
  TranslateService,
} from '@zro/pix-payments/application';

export class SyncWaitingRecentWarningPixDevolutionUseCase {
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
      context: SyncWaitingRecentWarningPixDevolutionUseCase.name,
    });
  }

  /**
   * Verify all primary priority waiting warning pix devolution
   * that have been updated after or equal a defined threshold date.
   */
  async execute(): Promise<void> {
    const thresholdDate = getMoment()
      .subtract(this.updatedAtThresholdInSeconds, 'seconds')
      .toDate();

    const waitingRecentWarningPixDevolutions =
      await this.repository.getAllByStateAndThresholdDate(
        WarningPixDevolutionState.WAITING,
        thresholdDate,
        ThresholdDateComparisonType.AFTER_OR_EQUAL_THAN,
      );

    this.logger.debug('Waiting recent warning pix devolutions found.', {
      length: waitingRecentWarningPixDevolutions.length,
    });

    for (const warningPixDevolution of waitingRecentWarningPixDevolutions) {
      const request: GetPaymentByIdPixPaymentPspRequest = {
        id: warningPixDevolution.id,
        externalId: warningPixDevolution.externalId,
      };

      this.logger.debug(
        'Get waiting recent warning pix devolution by ID on PSP gateway request.',
        { request },
      );

      let response: GetPaymentByIdPixPaymentPspResponse = null;

      try {
        response = await this.pspGateway.getPaymentById(request);
      } catch (error) {
        this.logger.error(
          'Error to get waiting recent warning pix devolution by ID on PSP gateway.',
          error,
        );
      }

      this.logger.debug(
        'Get waiting recent warning pix devolution by ID on PSP gateway response.',
        { response },
      );

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
            'Waiting recent warning pix devolution with invalid status on PSP gateway.',
            { response, warningPixDevolution },
          );
      }
    }

    this.logger.debug(
      'All waiting recent warning pix devolution have been checked.',
      {
        waitingRecentWarningPixDevolutions,
      },
    );
  }
}
