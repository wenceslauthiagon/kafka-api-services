import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfractionRefundOperationRepository,
  PixInfractionRefundOperationState,
  PixRefund,
  PixRefundDevolution,
  PixRefundDevolutionRepository,
  PixRefundDevolutionState,
  PixRefundRepository,
  PixRefundState,
  TGetPixInfractionRefundOperationFilter,
} from '@zro/pix-payments/domain';
import {
  PixRefundDevolutionNotFoundException,
  PixRefundGateway,
  OperationService,
  PixRefundEventEmitter,
  PixRefundDevolutionInvalidStateException,
  ClosePixRefundPspRequest,
  PixRefundDevolutionEventEmitter,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';

export class HandleCompletePixRefundDevolutionEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefundDevolution repository.
   * @param pixInfractionRefundOperationRepository Pix infraction refund operation repository.
   * @param operationService Operation Service.
   * @param pixRefundGateway PixRefundDevolution gateway.
   * @param refundEventEmitter PixRefundDevolution event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly refundDevolutionRepository: PixRefundDevolutionRepository,
    private readonly refundRepository: PixRefundRepository,
    private readonly pixInfractionRefundOperationRepository: PixInfractionRefundOperationRepository,
    private readonly operationService: OperationService,
    private readonly pixRefundGateway: PixRefundGateway,
    private readonly eventRefundEmitter: PixRefundEventEmitter,
    private readonly eventRefundDevolutionEmitter: PixRefundDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCompletePixRefundDevolutionEventUseCase.name,
    });
  }

  /**
   * Handler triggered when pixRefund is acknowledged to open status.
   *
   * @param id pix refund Id.
   * @returns PixRefundDevolution updated.
   */
  async execute(id: string, endToEndId?: string): Promise<PixRefundDevolution> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get pixRefund by id
    const pixRefundDevolution =
      await this.refundDevolutionRepository.getById(id);

    this.logger.debug('PixRefundDevolution found.', { pixRefundDevolution });

    if (!pixRefundDevolution) {
      throw new PixRefundDevolutionNotFoundException(pixRefundDevolution);
    }

    // Indepotent
    if (PixRefundDevolutionState.CONFIRMED === pixRefundDevolution.state) {
      return pixRefundDevolution;
    }

    // check if pix refund devolution has invalid state
    if (PixRefundDevolutionState.WAITING !== pixRefundDevolution.state) {
      throw new PixRefundDevolutionInvalidStateException(pixRefundDevolution);
    }

    //Get pixRefund for Close in PSP Gateway
    const pixRefund =
      await this.refundRepository.getByRefundDevolution(pixRefundDevolution);

    this.logger.debug('PixRefund found.', { pixRefund });

    if (!pixRefund) {
      throw new PixRefundNotFoundException({
        refundDevolution: pixRefundDevolution,
      });
    }

    // Accept refund operations.
    await this.acceptPixInfractionRefundOperations(pixRefund);

    this.logger.debug('Accepted pixRefundDevolution.', { pixRefundDevolution });

    pixRefundDevolution.state = PixRefundDevolutionState.CONFIRMED;
    pixRefundDevolution.endToEndId = endToEndId;

    await this.refundDevolutionRepository.update(pixRefundDevolution);
    this.eventRefundDevolutionEmitter.confirmedRefundDevolution(
      pixRefundDevolution,
    );

    // Notify completed refund to psp.
    const pixRefundCloseRequest: ClosePixRefundPspRequest = {
      solicitationPspId: pixRefund.solicitationPspId,
      status: pixRefund.status,
      devolutionId: pixRefund.refundDevolution.id,
      devolutionEndToEndId: pixRefundDevolution.endToEndId,
      analisysDetails: pixRefund.analysisDetails,
    };

    await this.pixRefundGateway.closeRefundRequest(pixRefundCloseRequest);

    this.logger.debug('PixRefundDevolution closed on PSP gateway.');

    // Update PixRefundDevolution
    pixRefund.state = PixRefundState.CLOSED_CONFIRMED;
    await this.refundRepository.update(pixRefund);

    // Fire event
    this.eventRefundEmitter.closeConfirmedPixRefund(pixRefund);

    this.logger.debug(
      'Updated pixRefund with close confirmed state and closed status.',
      { pixRefund },
    );

    return pixRefundDevolution;
  }

  private async acceptPixInfractionRefundOperations(
    pixRefund: PixRefund,
  ): Promise<void> {
    // Check if refund has any open pix infraction refund operation.
    const filter: TGetPixInfractionRefundOperationFilter = {
      pixRefund,
      states: [PixInfractionRefundOperationState.OPEN],
    };

    const pixInfractionRefundOperations =
      await this.pixInfractionRefundOperationRepository.getAllByFilter(filter);

    this.logger.debug('Pix infraction refund operations found.', {
      pixInfractionRefundOperations: pixInfractionRefundOperations,
    });

    // Refund is not associated to any refund operation.
    if (!pixInfractionRefundOperations?.length) return;

    for (const pixInfractionRefundOperation of pixInfractionRefundOperations) {
      await this.operationService.acceptOperation(
        pixInfractionRefundOperation.refundOperation,
      );

      this.logger.debug('Accepted pix infraction refund operation.', {
        pixInfractionRefundOperation,
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
