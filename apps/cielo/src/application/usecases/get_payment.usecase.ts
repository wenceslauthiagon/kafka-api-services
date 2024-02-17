import { NotFoundException } from '@nestjs/common';
import {
  CheckoutRepository,
  CheckoutHistoricRepository,
  CheckoutHistoric,
} from '@zro/cielo/domain';
import { GetPaymentResponse } from '@zro/cielo/interface';
import { Logger } from 'winston';

export class GetPaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
  ) {
    this.logger = logger.child({ context: GetPaymentUseCase.name });
  }

  async execute(checkoutId: string): Promise<GetPaymentResponse> {
    this.logger.debug('Receive get payment data.', { checkoutId });

    const checkout = await this.checkoutRepository.getById(checkoutId);

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    const historics = await this.checkoutHistoricRepository.findByCheckoutId(
      checkout.id,
    );

    if (historics && historics.length > 0) {
      checkout.historic = historics;
    }

    this.logger.debug('Received get payment status data.', { checkout });

    const response = new GetPaymentResponse({
      Id: checkout.id,
      Status: checkout.status,
      ReferenceId: checkout.referenceId,
      AuthorizationId: checkout.authorizationId,
      Destination: checkout.destination,
      RequesterName: checkout.requesterName,
      RequesterDocument: checkout.requesterDocument,
      RequesterContact: checkout.requesterContact,
      Amount: checkout.amount,
      CreatedAt: checkout.createdAt,
    });

    if (checkout.historic && checkout.historic.length > 0) {
      response.Historic = checkout.historic.map((item: CheckoutHistoric) => {
        const historticWithoutResponse = {
          Id: item.id,
          CheckoutId: item.checkoutId,
          CurrentStatus: item.currentStatus,
          PreviousStatus: item.previousStatus,
          Action: item.action,
          CreatedAt: item.createdAt,
        };
        return historticWithoutResponse;
      });
    }

    return response;
  }
}
