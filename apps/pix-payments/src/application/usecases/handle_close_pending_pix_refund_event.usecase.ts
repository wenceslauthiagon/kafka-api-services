import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { MissingDataException } from '@zro/common';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
  PixRefundDevolutionEntity,
  PixRefundDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixRefundNotFoundException,
  PixRefundEventEmitter,
  PixRefundInvalidStateException,
  PixRefundDevolutionEventEmitter,
} from '@zro/pix-payments/application';

export class HandleClosePendingPixRefundEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param eventEmitter PixRefundEventEmitter.
   * @param eventEmitterRefundDevolution PixRefundDevolutionEventEmitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly eventEmitter: PixRefundEventEmitter,
    private readonly eventEmitterRefundDevolution: PixRefundDevolutionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleClosePendingPixRefundEventUseCase.name,
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
    if (
      [PixRefundState.CLOSED_WAITING, PixRefundState.CLOSED_CONFIRMED].includes(
        pixRefund.state,
      )
    ) {
      return pixRefund;
    }

    // CLOSED PENDING AND ERROR states is accept.
    // ERROR state is accepted because after error observer is called again.
    if (
      ![PixRefundState.CLOSED_PENDING, PixRefundState.ERROR].includes(
        pixRefund.state,
      )
    ) {
      throw new PixRefundInvalidStateException(pixRefund);
    }

    const pixRefundDevolution = new PixRefundDevolutionEntity({
      id: uuidV4(),
      state: PixRefundDevolutionState.PENDING,
    });

    pixRefund.refundDevolution = pixRefundDevolution;
    pixRefund.state = PixRefundState.CLOSED_WAITING;
    await this.repository.update(pixRefund);

    // Fire waiting devolution
    this.eventEmitter.closeWaitingPixRefund(pixRefund);

    // Fire CreateRefundDevolutionEvent
    this.eventEmitterRefundDevolution.createRefundDevolution({
      ...pixRefundDevolution,
      pixRefund,
    });

    this.logger.debug('Updated pixRefund with closed waiting state.', {
      pixRefund,
    });

    return pixRefund;
  }
}
