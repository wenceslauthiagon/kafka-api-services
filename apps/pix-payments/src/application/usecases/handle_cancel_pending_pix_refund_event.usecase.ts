import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import {
  PixRefundNotFoundException,
  PixRefundGateway,
  CancelPixRefundPspRequest,
  PixRefundEventEmitter,
  PixRefundInvalidStateException,
} from '@zro/pix-payments/application';

export class HandleCancelPendingPixRefundEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param pixRefundGateway PixRefund gateway.
   * @param refundEventEmitter PixRefund event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly pixRefundGateway: PixRefundGateway,
    private readonly eventEmitter: PixRefundEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleCancelPendingPixRefundEventUseCase.name,
    });
  }

  /**
   * Handler triggered when pixRefund is acknowledged to open status.
   *
   * @param {String} id pix refund Id.
   * @returns {PixRefund} PixRefund updated.
   */
  async execute(id: string): Promise<PixRefund> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Get pixRefund by id
    const pixRefund = await this.repository.getById(id);

    this.logger.debug('PixRefund found.', {
      pixRefund,
    });

    if (!pixRefund) {
      throw new PixRefundNotFoundException(pixRefund);
    }

    // Indepotent
    if (pixRefund.state === PixRefundState.CANCEL_CONFIRMED) {
      return pixRefund;
    }

    // CANCEL PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixRefundState.CANCEL_PENDING, PixRefundState.ERROR].includes(
        pixRefund.state,
      )
    ) {
      throw new PixRefundInvalidStateException(pixRefund);
    }

    const pixRefundCancelRequest: CancelPixRefundPspRequest = {
      solicitationPspId: pixRefund.solicitationPspId,
      status: pixRefund.status,
      analisysDetails: pixRefund.analysisDetails,
      rejectionReason: pixRefund.rejectionReason,
    };

    //call PSP
    await this.pixRefundGateway.cancelRefundRequest(pixRefundCancelRequest);

    this.logger.debug('PixRefund canceled on PSP gateway.');

    // Update PixRefund
    pixRefund.state = PixRefundState.CANCEL_CONFIRMED;
    await this.repository.update(pixRefund);

    // Fire event
    this.eventEmitter.cancelConfirmedPixRefund(pixRefund);

    this.logger.debug(
      'Updated pixRefund with cancel confirmed state and cancelled status.',
      { pixRefund },
    );

    return pixRefund;
  }
}
