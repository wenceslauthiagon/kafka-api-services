import { Logger } from 'winston';
import { v4 as uuidV4 } from 'uuid';
import { IPaymentsService } from '@zro/picpay/application';
import {
  CheckoutRepository,
  Checkout,
  CheckoutHistoric,
  PaymentStatusEnum,
  CheckoutHistoricRepository,
  CreatePayment,
} from '@zro/picpay/domain';
import { CreatePaymentResponse } from '@zro/picpay/interface';

export class CreatePaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly picpayService: IPaymentsService,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
    private readonly picpayChannel: string,
    private readonly picpayPurchaseMode: string,
    private readonly picpaySoftDescriptor: string,
  ) {
    this.logger = logger.child({ context: CreatePaymentUseCase.name });
  }

  async execute(checkoutId: string): Promise<CreatePaymentResponse> {
    this.logger.debug('Receive Picpay Payment data.', { checkoutId });

    const checkout = await this.checkoutRepository.getById(checkoutId);

    this.logger.debug('Create PicPay HTTP Request.', { checkout });

    const request = this.createPaymentRequest(checkout);

    this.logger.debug('PicPay Payment Created.', { request });

    const response = await this.picpayService.create(request);
    await this.createCheckoutHistoric(checkout, response);

    this.logger.debug('Response saved.', { response });

    return response;
  }

  private createPaymentRequest(checkout: Checkout): CreatePayment {
    const {
      id,
      referenceId,
      amount,
      expiresAt,
      requesterDocument,
      requesterContact,
      requesterName,
      destination,
    } = checkout;
    const [firstName, lastName] = requesterName.split(' ');

    const request: CreatePayment = {
      checkoutId: id,
      referenceId,
      value: amount,
      expiresAt,
      buyer: {
        document: requesterDocument,
        phone: requesterContact,
        firstName,
        lastName,
        email: destination,
      },
      channel: this.picpayChannel,
      purchaseMode: this.picpayPurchaseMode,
      softDescriptor: this.picpaySoftDescriptor,
      notification: {
        disablePush: false,
        disableEmail: false,
      },
      autoCapture: true,
    };

    return request;
  }

  private async createCheckoutHistoric(
    checkout: Checkout,
    response: CreatePaymentResponse,
  ) {
    const historicModel: CheckoutHistoric = {
      id: uuidV4(),
      checkoutId: checkout.id,
      currentStatus: PaymentStatusEnum.CREATED,
      previousStatus: checkout.status,
      action: PaymentStatusEnum.CREATED,
      response: JSON.stringify(response),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    checkout.status = PaymentStatusEnum.CREATED;

    await this.checkoutRepository.update(checkout);
    await this.checkoutHistoricRepository.create(historicModel);
  }
}
