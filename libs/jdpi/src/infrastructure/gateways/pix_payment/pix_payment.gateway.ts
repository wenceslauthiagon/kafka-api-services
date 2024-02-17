import { Logger } from 'winston';
import { AxiosInstance } from 'axios';
import {
  CreateQrCodeStaticPixPaymentPspRequest,
  CreateQrCodeStaticPixPaymentPspResponse,
  DeleteQrCodeStaticPixPaymentPspRequest,
  CreatePaymentPixPaymentPspRequest,
  DecodeQrCodePixPaymentPspRequest,
  DecodeQrCodePixPaymentPspResponse,
  CreatePixDevolutionPixPaymentPspRequest,
  CreatePixDevolutionPixPaymentPspResponse,
  PixPaymentGateway,
  CreatePaymentPixPaymentPspResponse,
  GetPaymentPixPaymentPspRequest,
  GetPaymentPixPaymentPspResponse,
  CreatePixDevolutionRefundPixPaymentPspRequest,
  CreateQrCodeDynamicPixPaymentPspRequest,
  CreateQrCodeDynamicPixPaymentPspResponse,
  CreateWarningPixDevolutionPixPaymentPspRequest,
  CreatePixDevolutionRefundPixPaymentPspResponse,
  CreateWarningPixDevolutionPixPaymentPspResponse,
  CreateQrCodeDynamicDueDatePixPaymentPspRequest,
  CreateQrCodeDynamicDueDatePixPaymentPspResponse,
  GetPaymentByIdPixPaymentPspRequest,
  GetPaymentByIdPixPaymentPspResponse,
  UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
  UpdateQrCodeDynamicDueDatePixPaymentPspResponse,
} from '@zro/pix-payments/application';
import {
  JdpiDecodeQrCodePixPaymentPspGateway,
  JdpiCreateQrCodeStaticPixPaymentPspGateway,
  JdpiCreateQrCodeDynamicPixPaymentPspGateway,
  JdpiCreateQrCodeDynamicDueDatePixPaymentPspGateway,
  JdpiCreatePaymentPixPaymentPspGateway,
  JdpiCreatePixDevolutionPixPaymentPspGateway,
  JdpiGetPaymentPixPaymentPspGateway,
  JdpiCreatePixDevolutionRefundPixPaymentPspGateway,
  JdpiGetPaymentByIdPixPaymentPspGateway,
  JdpiCreateWarningPixDevolutionPixPaymentPspGateway,
  JdpiUpdateQrCodeDynamicDueDatePixPaymentGateway,
} from '@zro/jdpi';

export class JdpiPixPaymentGateway implements PixPaymentGateway {
  constructor(
    private readonly logger: Logger,
    private readonly jdpiPixPayment: AxiosInstance,
    private readonly pspIspb: number,
    private readonly pspOpenBankingBaseUrl: string,
  ) {
    this.logger = logger.child({ context: JdpiPixPaymentGateway.name });
  }

  async createQrCodeStatic(
    request: CreateQrCodeStaticPixPaymentPspRequest,
  ): Promise<CreateQrCodeStaticPixPaymentPspResponse> {
    this.logger.debug('Create qrCodeStatic request.', { request });

    const gateway = new JdpiCreateQrCodeStaticPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.createQrCodeStatic(request);
  }

  async deleteQrCodeStatic(
    request: DeleteQrCodeStaticPixPaymentPspRequest,
  ): Promise<void> {
    this.logger.debug('Delete qrCodeStatic request.', { request });

    return null;
  }

  async decodeQrCode(
    request: DecodeQrCodePixPaymentPspRequest,
  ): Promise<DecodeQrCodePixPaymentPspResponse> {
    const gateway = new JdpiDecodeQrCodePixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );
    return gateway.decodeQrCode(request);
  }

  async createPayment(
    request: CreatePaymentPixPaymentPspRequest,
  ): Promise<CreatePaymentPixPaymentPspResponse> {
    this.logger.debug('Create payment request.', { request });

    const gateway = new JdpiCreatePaymentPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.createPayment(request);
  }

  async createPixDevolution(
    request: CreatePixDevolutionPixPaymentPspRequest,
  ): Promise<CreatePixDevolutionPixPaymentPspResponse> {
    this.logger.debug('Create devolution request.', { request });

    const gateway = new JdpiCreatePixDevolutionPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.createPixDevolution(request);
  }

  async getPayment(
    request: GetPaymentPixPaymentPspRequest,
  ): Promise<GetPaymentPixPaymentPspResponse> {
    this.logger.debug('Get payment request.', { request });

    const gateway = new JdpiGetPaymentPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.getPayment(request);
  }

  async createPixDevolutionRefund(
    request: CreatePixDevolutionRefundPixPaymentPspRequest,
  ): Promise<CreatePixDevolutionRefundPixPaymentPspResponse> {
    this.logger.debug('Create pix devolution for a refund request.', {
      request,
    });

    const gateway = new JdpiCreatePixDevolutionRefundPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.createPixDevolutionRefund(request);
  }

  async createQrCodeDynamic(
    request: CreateQrCodeDynamicPixPaymentPspRequest,
  ): Promise<CreateQrCodeDynamicPixPaymentPspResponse> {
    this.logger.debug('Create qrCodeDynamic request.', { request });

    const gateway = new JdpiCreateQrCodeDynamicPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
      this.pspIspb,
      this.pspOpenBankingBaseUrl,
    );

    return gateway.createQrCodeDynamic(request);
  }

  async createQrCodeDynamicDueDate(
    request: CreateQrCodeDynamicDueDatePixPaymentPspRequest,
  ): Promise<CreateQrCodeDynamicDueDatePixPaymentPspResponse> {
    this.logger.debug('Create qrCodeDynamicDueDate request.', { request });

    const gateway = new JdpiCreateQrCodeDynamicDueDatePixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
      this.pspOpenBankingBaseUrl,
    );

    return gateway.createQrCodeDynamicDueDate(request);
  }

  async createWarningPixDevolution(
    request: CreateWarningPixDevolutionPixPaymentPspRequest,
  ): Promise<CreateWarningPixDevolutionPixPaymentPspResponse> {
    this.logger.debug('Create warning pix devolution request.', { request });

    const gateway = new JdpiCreateWarningPixDevolutionPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.createWarningPixDevolution(request);
  }

  async getPaymentById(
    request: GetPaymentByIdPixPaymentPspRequest,
  ): Promise<GetPaymentByIdPixPaymentPspResponse> {
    this.logger.debug('Get payment request.', { request });

    const gateway = new JdpiGetPaymentByIdPixPaymentPspGateway(
      this.logger,
      this.jdpiPixPayment,
    );

    return gateway.getPaymentById(request);
  }

  async updateQrCodeDynamicDueDate(
    request: UpdateQrCodeDynamicDueDatePixPaymentPspRequest,
  ): Promise<UpdateQrCodeDynamicDueDatePixPaymentPspResponse> {
    this.logger.debug('Update qrCodeDynamicDueDate request.', { request });

    const gateway = new JdpiUpdateQrCodeDynamicDueDatePixPaymentGateway(
      this.logger,
      this.jdpiPixPayment,
      this.pspIspb,
      this.pspOpenBankingBaseUrl,
    );

    return gateway.updateQrCodeDynamicDueDate(request);
  }
}
