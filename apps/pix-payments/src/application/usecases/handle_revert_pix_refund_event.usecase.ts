import { Logger } from 'winston';
import { Failed, MissingDataException } from '@zro/common';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
} from '@zro/pix-payments/domain';
import {
  PixRefundNotFoundException,
  PixRefundEventEmitter,
} from '@zro/pix-payments/application';

export class HandleRevertPixRefundEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefundRepository repository.
   * @param eventEmitter PixRefund event emitter.
   * @param operationService Operation service.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly eventEmitter: PixRefundEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleRevertPixRefundEventUseCase.name,
    });
  }

  /**
   * Handler triggered when an revert refund is thrown.
   *
   * @param {String} id PixRefund id.
   * @returns {PixRefund} PixRefund updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {PixRefundNotFoundException} Thrown when refund id was not found.
   */
  async execute(id: string, failed?: Failed): Promise<PixRefund> {
    // Data input check
    if (!id) {
      throw new MissingDataException(['ID']);
    }

    // Search Pix Refund
    const refund = await this.repository.getById(id);

    this.logger.debug('Found Pix Refund.', { refund });

    if (!refund) {
      throw new PixRefundNotFoundException({ id });
    }

    // Check indepotent
    if (refund.state === PixRefundState.ERROR) {
      return refund;
    }

    // Update refund
    refund.failed = failed;
    refund.state = PixRefundState.ERROR;

    await this.repository.update(refund);
    this.eventEmitter.errorPixRefund(refund);

    return refund;
  }
}
