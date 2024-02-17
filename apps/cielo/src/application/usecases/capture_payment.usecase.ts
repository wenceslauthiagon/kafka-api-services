import * as uuid from 'uuid';
import { BadRequestException } from '@nestjs/common';
import {
  CheckoutRepository,
  CheckoutHistoricRepository,
  Checkout,
  CheckoutHistoric,
} from '@zro/cielo/domain';
import { ICieloService } from '@zro/cielo/application';
import {
  CapturePaymentRequest,
  CapturePaymentResponse,
} from '@zro/cielo/interface';
import { Logger } from 'winston';
import { CieloTransactionStatusEnum } from '@zro/cielo/infrastructure';

export class CapturePaymentUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricRepository,
    private readonly cieloService: ICieloService,
  ) {
    this.logger = logger.child({ context: CapturePaymentUseCase.name });
  }

  async execute(
    request: CapturePaymentRequest,
  ): Promise<CapturePaymentResponse> {
    this.logger.debug('Receive capture payment data.', { request });

    const checkout = await this.checkoutRepository.getByReferenceId(
      request.ReferenceId,
    );

    if (!checkout) {
      throw new BadRequestException(`Checkout was not found!`);
    }

    this.logger.debug('Receive checkout payment.', {
      checkout,
    });

    const cieloResponse = await this.cieloService.getTransaction(
      request.ReferenceId,
    );

    this.logger.debug('Cielo capture status founded.', {
      cieloResponse,
    });

    //sync payment infos
    checkout.status = this.getEnumKey(
      CieloTransactionStatusEnum,
      cieloResponse.Payment.Status,
    );

    checkout.referenceId = cieloResponse.Payment.PaymentId;

    if (cieloResponse.Payment.AuthorizationCode)
      checkout.authorizationId = cieloResponse.Payment.AuthorizationCode;

    const updatedPayment = await this.checkoutRepository.update(checkout);

    this.logger.debug('Cielo capture status updated.', {
      updatedPayment,
    });

    const historics = await this.checkoutHistoricRepository.findByCheckoutId(
      checkout.id,
    );

    if (historics && historics.length > 0) checkout.historic = historics;

    await this.checkoutHistoricRepository.create(
      this.createCheckoutHistoricModel(checkout, cieloResponse),
    );

    this.logger.debug('Response saved.', { cieloResponse });

    return this.toResponse(updatedPayment.status, updatedPayment.id);
  }

  createCheckoutHistoricModel(checkout: Checkout, response: any) {
    if (response.Payment.DebitCard) delete response.Payment.DebitCard;
    if (response.Payment.CreditCard) delete response.Payment.CreditCard;

    const historic: CheckoutHistoric = {
      id: uuid.v4(),
      checkoutId: checkout.id,
      previousStatus: this.getCurrentStatus(checkout),
      currentStatus: this.getEnumKey(
        CieloTransactionStatusEnum,
        response.Payment.Status,
      ),
      action: 'webhook',
      response: response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return historic;
  }

  private toResponse(
    status: string,
    checkoutId: string,
  ): CapturePaymentResponse {
    return {
      CheckoutId: checkoutId,
      Status: status,
    };
  }

  private getEnumKey<T>(enumObj: T, enumValue: number): keyof T | undefined {
    return (Object.keys(enumObj) as Array<keyof T>).find(
      (key) => enumObj[key] === enumValue,
    );
  }

  private getCurrentStatus(checkout) {
    if (checkout && checkout.historic && checkout.historic.length > 0) {
      const latest = checkout.historic[checkout.historic.length - 1];
      return latest.currentStatus;
    }
    return null;
  }
}
