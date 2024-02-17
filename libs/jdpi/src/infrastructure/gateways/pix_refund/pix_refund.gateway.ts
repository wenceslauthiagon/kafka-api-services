import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CancelPixRefundPspRequest,
  CancelPixRefundPspResponse,
  ClosePixRefundPspRequest,
  ClosePixRefundPspResponse,
  GetPixRefundPspRequest,
  GetPixRefundPspResponse,
  PixRefundGateway,
} from '@zro/pix-payments/application';
import {
  JdpiCancelPixRefundPspGateway,
  JdpiClosePixRefundPspGateway,
  JdpiGetPixRefundPspGateway,
} from '@zro/jdpi';

export class JdpiPixRefundGateway implements PixRefundGateway {
  constructor(
    private logger: Logger,
    private jdpiPixRefund: AxiosInstance,
    private pspIspb: number,
  ) {
    this.logger = logger.child({
      context: JdpiPixRefundGateway.name,
    });
  }

  async closeRefundRequest(
    request: ClosePixRefundPspRequest,
  ): Promise<ClosePixRefundPspResponse> {
    this.logger.debug('Close refund request.', { request });

    const gateway = new JdpiClosePixRefundPspGateway(
      this.logger,
      this.jdpiPixRefund,
      this.pspIspb,
    );

    return gateway.closeRefundRequest(request);
  }

  async cancelRefundRequest(
    request: CancelPixRefundPspRequest,
  ): Promise<CancelPixRefundPspResponse> {
    this.logger.debug('Cancel refund request.', { request });

    const gateway = new JdpiCancelPixRefundPspGateway(
      this.logger,
      this.jdpiPixRefund,
      this.pspIspb,
    );

    return gateway.cancelRefundRequest(request);
  }

  async getRefundRequest(
    request: GetPixRefundPspRequest,
  ): Promise<GetPixRefundPspResponse[]> {
    this.logger.debug('Get refund request.', { request });

    const gateway = new JdpiGetPixRefundPspGateway(
      this.logger,
      this.jdpiPixRefund,
      this.pspIspb,
    );

    return gateway.getRefundRequest(request);
  }
}
