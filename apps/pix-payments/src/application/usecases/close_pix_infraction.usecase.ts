import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionAnalysisResultType,
  PixInfractionType,
  PixInfractionRefundOperationState,
  TGetPixInfractionRefundOperationFilter,
  PixInfractionRefundOperationRepository,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  PixInfractionEventEmitter,
  OperationService,
} from '@zro/pix-payments/application';

export class ClosePixInfractionUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param eventEmitter Infraction event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly eventEmitter: PixInfractionEventEmitter,
    private readonly operationService: OperationService,
  ) {
    this.logger = logger.child({ context: ClosePixInfractionUseCase.name });
  }

  /**
   * Close pix infraction that was created by IssueGateway.
   *
   * @param {String} issueId external infraction id.
   * @param {PixInfractionAnalysisResultType} analysisResult Result of psp analysis.
   * @param {String} analysisDetails external analysis details.
   * @returns {PixInfraction} infraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {InfractionNotFoundException} Thrown when infraction id was not found.
   */
  async execute(
    issueId: number,
    analysisResult: PixInfractionAnalysisResultType,
    analysisDetails: string,
  ): Promise<PixInfraction> {
    if (!issueId || !analysisResult) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!analysisResult ? ['Analysis Result'] : []),
      ]);
    }

    const infraction = await this.infractionRepository.getByIssueId(issueId);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException({ issueId });
    }

    // Indepotent
    if (
      infraction.state === PixInfractionState.CLOSED_PENDING ||
      infraction.state === PixInfractionState.CLOSED_CONFIRMED
    ) {
      return infraction;
    }

    infraction.status = PixInfractionStatus.CLOSED;
    infraction.state = PixInfractionState.CLOSED_PENDING;
    infraction.analysisResult = analysisResult;
    infraction.analysisDetails = analysisDetails;

    await this.infractionRepository.update(infraction);

    this.logger.debug(
      'Updated infraction with pending state and closed status.',
      { infraction },
    );

    if (
      infraction.analysisResult === PixInfractionAnalysisResultType.DISAGREED &&
      infraction.infractionType === PixInfractionType.REFUND_REQUEST &&
      infraction.operation
    ) {
      await this.revertRefundOperations(infraction);
    }

    this.eventEmitter.closedPendingInfraction(infraction);

    return infraction;
  }

  private async revertRefundOperations(
    infraction: PixInfraction,
  ): Promise<void> {
    // Check if infraction has any open pix infraction refund operation.
    const filter: TGetPixInfractionRefundOperationFilter = {
      pixInfraction: infraction,
      states: [PixInfractionRefundOperationState.OPEN],
    };

    const pixInfractionRefundOperations =
      await this.pixInfractionRefundOperationRepository.getAllByFilter(filter);

    this.logger.debug('Pix infraction refund operations found.', {
      pixInfractionRefundOperations,
    });

    // Infraction is not associated to any refund operation.
    if (!pixInfractionRefundOperations?.length) return;

    for (const pixInfractionRefundOperation of pixInfractionRefundOperations) {
      // Revert pix infraction's refund operation.
      await this.operationService.revertOperation(
        pixInfractionRefundOperation.refundOperation,
      );

      this.logger.debug('Reverted refund operation.', {
        operation: pixInfractionRefundOperation.refundOperation,
      });

      // Close pix infraction refund operation.
      pixInfractionRefundOperation.state =
        PixInfractionRefundOperationState.CLOSED;

      await this.pixInfractionRefundOperationRepository.update(
        pixInfractionRefundOperation,
      );

      this.logger.debug('Updated pix infraction refund operation.', {
        pixInfractionRefundOperation,
      });
    }
  }
}
