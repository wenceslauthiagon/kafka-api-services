import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionAnalysisResultType,
  PixInfractionRefundOperationRepository,
  TGetPixInfractionRefundOperationFilter,
  PixInfractionRefundOperationState,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  PixInfractionEventEmitter,
  OperationService,
} from '@zro/pix-payments/application';

export class HandleCancelPixInfractionReceivedEventUseCase {
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
    private readonly operationService: OperationService,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCancelPixInfractionReceivedEventUseCase.name,
    });
  }

  async execute(
    infractionPspId: string,
    analysisResult: PixInfractionAnalysisResultType,
    analysisDetails: string,
  ): Promise<PixInfraction> {
    // Data input check

    if (!infractionPspId || !analysisResult) {
      throw new MissingDataException([
        ...(!infractionPspId ? ['Infraction ID'] : []),
        ...(!analysisResult ? ['Analysis Result'] : []),
      ]);
    }

    const infraction =
      await this.infractionRepository.getByInfractionPspId(infractionPspId);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException({ infractionPspId });
    }

    // Indepotent
    if (
      infraction.state === PixInfractionState.CANCEL_PENDING ||
      infraction.state === PixInfractionState.CANCEL_CONFIRMED
    ) {
      return infraction;
    }

    infraction.status = PixInfractionStatus.CANCELLED;
    infraction.state = PixInfractionState.CANCEL_PENDING;
    infraction.analysisResult = analysisResult;
    infraction.analysisDetails = analysisDetails;

    await this.infractionRepository.update(infraction);

    this.logger.debug(
      'Updated infraction with pending state and canceled status.',
      { infraction },
    );

    // Revert infraction refund operations, if they exist.
    await this.revertRefundOperations(infraction);

    this.eventEmitter.cancelPendingInfractionReceived(infraction);

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
