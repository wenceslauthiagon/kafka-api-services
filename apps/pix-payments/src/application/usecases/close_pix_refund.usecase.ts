import { Logger } from 'winston';

import { MissingDataException } from '@zro/common';
import {
  PixRefund,
  PixRefundRepository,
  PixRefundState,
  PixRefundStatus,
} from '@zro/pix-payments/domain';
import {
  PixRefundEventEmitter,
  PixRefundNotFoundException,
} from '@zro/pix-payments/application';

export class ClosePixRefundUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param repository PixRefund repository.
   * @param refundEventEmitter PixRefund event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly repository: PixRefundRepository,
    private readonly refundEventEmitter: PixRefundEventEmitter,
  ) {
    this.logger = logger.child({ context: ClosePixRefundUseCase.name });
  }

  /**
   * Close refund.
   *
   * @param issueId issue id.
   * @param analisysDetails analisys details.
   * @returns {PixRefund} PixRefund created.
   * @throws {MissingDataException} Thrown when any required params are missing.
   */
  async execute(issueId: number, analisysDetails: string): Promise<PixRefund> {
    // Data input check
    if (!issueId || !analisysDetails) {
      throw new MissingDataException([
        ...(!issueId ? ['Issue ID'] : []),
        ...(!analisysDetails ? ['Analysis Details'] : []),
      ]);
    }

    // Check if PixRefund's is available
    const pixRefund = await this.repository.getByIssueId(issueId);

    this.logger.debug('Check if refund exists.', { refund: pixRefund });

    if (!pixRefund) {
      throw new PixRefundNotFoundException({ issueId });
    }

    // Indepotent
    if (pixRefund.state === PixRefundState.CLOSED_PENDING) {
      return pixRefund;
    }

    pixRefund.state = PixRefundState.CLOSED_PENDING;
    pixRefund.status = PixRefundStatus.CLOSED;
    pixRefund.analysisDetails = analisysDetails;

    // Update PixRefund
    await this.repository.update(pixRefund);

    this.logger.debug('updated refund.', { pixRefund });

    this.refundEventEmitter.closePendingPixRefund(pixRefund);

    return pixRefund;
  }
}
