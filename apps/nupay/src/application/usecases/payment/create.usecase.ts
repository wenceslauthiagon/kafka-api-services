import { v4 as uuidV4 } from 'uuid';
import { Logger } from 'winston';
import {
  CreatePaymentResponse,
  PreCheckoutRequest,
  nupayConstants,
} from '@zro/nupay/interface';
import {
  CheckoutInvalidStateException,
  CheckoutNotFoundException,
  IPaymentService,
} from '@zro/nupay/application';
import {
  Checkout,
  CheckoutHistoric,
  CheckoutHistoricRepository,
  CheckoutRepository,
  PaymentStatusEnum,
} from '@zro/nupay/domain';
import { NuPayCreatePaymentRequest } from '@zro/nupay/interface/dtos/nupay_create_payment_request';
import { NuPayCreatePaymentResponse } from '@zro/nupay/interface/dtos/nupay_create_payment_response';

export class CreatePaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly nupayService: IPaymentService,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({ context: CreatePaymentUseCase.name });
  }

  async execute(checkoutId: string): Promise<CreatePaymentResponse> {
    const checkout = await this.checkoutRepository.getById(checkoutId);

    if (!checkout) {
      throw new CheckoutNotFoundException({ id: checkoutId });
    }

    if (
      checkout.status === PaymentStatusEnum.COMPLETED ||
      checkout.status === PaymentStatusEnum.CANCELLED
    ) {
      throw new CheckoutInvalidStateException(checkout);
    }

    let checkoutHistoric = null;

    try {
      this.logger.debug('Create NuPay HTTP Request.', { checkout });

      const request = this.createPaymentRequest(checkout);

      this.logger.debug('Create payment.', { request });

      const response = await this.nupayService.create(request);

      this.logger.debug('NuPay payment created.', { request });

      this.logger.debug('Create payment history.');

      checkoutHistoric = await this.createCheckoutHistoric(checkout, response);
    } catch (err) {
      checkoutHistoric = await this.createCheckoutHistoricError(checkout, err);
    }

    this.logger.debug('NuPay payment history created.', { checkoutHistoric });

    return new CreatePaymentResponse({
      id: checkout.id,
      status: checkout.status,
      referenceId: checkout.referenceId,
      authorizationId: checkout.authorizationId,
      destination: checkout.destination,
      requesterName: checkout.requesterName,
      requesterDocument: checkout.requesterDocument,
      requesterContact: checkout.requesterContact,
      amount: checkout.amount,
      currency: checkout.currency,
      createdAt: checkout.createdAt,
      updatedAt: checkout.createdAt,
      expiresAt: checkout.expiresAt,
    });
  }

  private createPaymentRequest(checkout: Checkout): NuPayCreatePaymentRequest {
    const {
      amount,
      payload,
      requesterDocument,
      requesterContact,
      requesterName,
      destination,
    } = checkout;
    const [firstName, ...lastName] = requesterName.split(' ');

    const preCheckoutRequest = payload as PreCheckoutRequest;
    const referenceId = uuidV4();
    const merchantOrderReference = this.generateMerchantOrderReference(
      referenceId,
      preCheckoutRequest,
    );
    const { shopper, items, billingAddress } = preCheckoutRequest;
    const request: NuPayCreatePaymentRequest = {
      referenceId,
      merchantOrderReference,
      paymentMethod: {
        type: nupayConstants.payment.paymentMethodType,
      },
      amount: {
        currency: nupayConstants.payment.currency,
        value: amount,
      },
      shopper: {
        firstName,
        lastName: lastName.join(' '),
        document: requesterDocument,
        documentType: shopper.documentType,
        email: destination,
        phone: {
          country: nupayConstants.payment.phone.country,
          number: requesterContact,
        },
      },
      items: items.map((item) => ({
        id: item.id,
        value: item.value,
        quantity: item.quantity,
        description: item.description,
      })),
      billingAddress: {
        street: billingAddress.street,
        number: billingAddress.number,
        postalCode: billingAddress.postalCode,
        city: billingAddress.city,
        state: billingAddress.state,
        country: billingAddress.country,
        complement: billingAddress.complement,
        neighborhood: billingAddress.neighborhood,
      },
    };

    return request;
  }

  private async createCheckoutHistoric(
    checkout: Checkout,
    response: NuPayCreatePaymentResponse,
  ) {
    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkout.id,
      currentStatus: PaymentStatusEnum[response.status],
      previousStatus: checkout.status,
      action: 'Create',
      response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    checkout.status = PaymentStatusEnum[response.status];
    checkout.referenceId = response.pspReferenceId;
    checkout.authorizationId = null;
    await this.checkoutRepository.update(checkout);
    await this.checkoutHistoricRepository.create(historicModel);
  }

  private async createCheckoutHistoricError(checkout: Checkout, error: Error) {
    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkout.id,
      currentStatus: PaymentStatusEnum.ERROR,
      previousStatus: checkout.status,
      action: 'Create',
      response: { name: error.name, message: error.message },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    checkout.status = PaymentStatusEnum.ERROR;
    checkout.referenceId = null;
    checkout.authorizationId = null;
    await this.checkoutRepository.update(checkout);
    await this.checkoutHistoricRepository.create(historicModel);
  }

  private generateMerchantOrderReference(
    referenceId: string,
    payload: PreCheckoutRequest,
  ): string {
    return `${payload.merchantName || ''}_[${payload.shopper.documentType}_${
      payload.shopper.document
    }]_${referenceId}`;
  }
}
