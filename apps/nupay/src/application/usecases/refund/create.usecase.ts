import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  CreateRefundRequest,
  CreateRefundResponse,
  nupayConstants,
} from '@zro/nupay/interface';
import { IRefundService } from '@zro/nupay/application';
import {
  Checkout,
  CheckoutHistoric,
  CheckoutHistoricRepository,
  CheckoutRepository,
  PaymentStatusEnum,
} from '@zro/nupay/domain';
import { NuPayCreateRefundRequest } from '@zro/nupay/interface/dtos/nupay_create_refund_request';
import { NuPayCreateRefundResponse } from '@zro/nupay/interface/dtos/nupay_create_refund_response';

export class CreateRefundUseCase {
  constructor(
    private logger: Logger,
    private readonly nupayService: IRefundService,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({ context: CreateRefundUseCase.name });
  }

  async execute(request: CreateRefundRequest): Promise<CreateRefundResponse> {
    this.logger.debug('Receive NuPay Refund data.', { request });

    const checkoutId = request.checkoutId;

    const checkout = await this.checkoutRepository.getById(checkoutId);

    const referenceId = checkout.referenceId;
    this.logger.debug('Create NuPay HTTP Request.', { request });

    const nupayRequest = this.createRefundRequest(request);

    this.logger.debug('Create refund.', { request });

    const response = await this.nupayService.create(referenceId, nupayRequest);

    this.logger.debug('NuPay refund created.', { nupayRequest });

    this.logger.debug('Create refund history.');

    const refundHistoric = await this.createCheckoutHistoric(
      checkout,
      response,
    );

    this.logger.debug('NuPay refund history created.', { refundHistoric });

    return new CreateRefundResponse({
      id: checkout.id,
      status: checkout.status,
      referenceId: checkout.referenceId,
      authorizationId: checkout.authorizationId,
      destination: checkout.destination,
      requesterName: checkout.requesterName,
      requesterDocument: checkout.requesterDocument,
      requesterContact: checkout.requesterContact,
      currency: checkout.currency,
      amount: checkout.amount,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt,
      expiresAt: checkout.expiresAt,
    });
  }

  private createRefundRequest(
    request: CreateRefundRequest,
  ): NuPayCreateRefundRequest {
    const { amount, notes } = request;

    const transactionRefundId = this.generateTransactionRefundId();
    const nupayRequest: NuPayCreateRefundRequest = {
      transactionRefundId,
      amount: {
        value: amount,
        currency: nupayConstants.payment.currency,
      },
      notes,
    };

    return nupayRequest;
  }

  private async createCheckoutHistoric(
    checkout: Checkout,
    response: NuPayCreateRefundResponse,
  ) {
    const status = PaymentStatusEnum[`REFUND_${response.status}`];
    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkout.id,
      currentStatus: status,
      previousStatus: checkout.status,
      action: 'Refund',
      response,
      updatedAt: new Date(),
      createdAt: new Date(),
    };
    checkout.status = status;
    checkout.referenceId = response.pspReferenceId;
    checkout.authorizationId = response.refundId;
    await this.checkoutRepository.update(checkout);
    await this.checkoutHistoricRepository.create(historicModel);
  }
  private generateTransactionRefundId(): string {
    return uuidV4();
  }
}
