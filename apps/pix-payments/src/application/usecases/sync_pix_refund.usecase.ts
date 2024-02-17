import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import { PixRefundStatus } from '@zro/pix-payments/domain';
import {
  PixRefundGateway,
  GetPixRefundPspRequest,
  GetPixRefundPspResponse,
  PixRefundEvent,
  PixRefundEventEmitter,
} from '@zro/pix-payments/application';

export class SyncPixRefundUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param eventEmitter Pix Refund event emitter.
   * @param pspGateway Pix refund gateway.
   */
  constructor(
    private logger: Logger,
    private readonly eventEmitter: PixRefundEventEmitter,
    private readonly pspGateway: PixRefundGateway,
  ) {
    this.logger = logger.child({ context: SyncPixRefundUseCase.name });
  }

  /**
   * Sync all open pix refunds from PSP.
   */
  async execute(): Promise<void> {
    this.logger.debug(
      `Sync pix refunds from the PSP with the status marked as ${PixRefundStatus.OPEN}.`,
    );

    const request: GetPixRefundPspRequest = { status: PixRefundStatus.OPEN };

    this.logger.debug('Get pix refunds from PSP gateway request.', {
      request,
    });

    const pixRefunds = await this.pspGateway.getRefundRequest(request);

    this.logger.debug('Get pix refunds from PSP gateway response.', {
      length: pixRefunds.length,
    });

    for (const pixRefund of pixRefunds) {
      switch (pixRefund.status) {
        case PixRefundStatus.OPEN:
          this.handleReceivePixRefund(pixRefund);
          break;

        default:
          this.logger.error('Invalid pix refund status.', {
            pixRefund,
          });
      }
    }
  }

  private handleReceivePixRefund(pixRefund: GetPixRefundPspResponse): void {
    this.logger.debug('Handle receive pix refund.', { pixRefund });

    const payload: PixRefundEvent = {
      id: uuidV4(),
      contested: pixRefund.contested,
      amount: pixRefund.refundAmount,
      description: pixRefund.refundDetails,
      reason: pixRefund.refundReason,
      status: pixRefund.status,
      solicitationPspId: pixRefund.solicitationId,
      endToEndIdTransaction: pixRefund.transactionEndToEndId,
      infractionId: pixRefund.infractionId,
      requesterIspb: pixRefund.requesterIspb,
      responderIspb: pixRefund.responderIspb,
    };

    this.eventEmitter.receivePixRefund(payload);

    this.logger.debug('Receive pix refund.', { pixRefund: payload });
  }
}
