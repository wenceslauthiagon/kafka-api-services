import * as uuid from 'uuid';
import {
  Checkout,
  CheckoutRepository,
  CheckoutHistoric,
} from '@zro/cielo/domain';
import {
  CreditTransactionRequest,
  CreditTransactionResponse,
} from '@zro/cielo/interface';
import { ICieloService } from '@zro/cielo/application';
import { Logger } from 'winston';
import {
  CheckoutHistoricDatabaseRepository,
  CieloCreateCreditTransactionRequest,
  CieloCreditCardCommon,
  CieloTransactionStatusEnum,
} from '@zro/cielo/infrastructure';
import { NotFoundException } from '@nestjs/common';

export class CreateCreditTransactionUseCase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    private readonly cieloService: ICieloService,
    private readonly appCieloCredentialsCode: string,
    private readonly appCieloCredentialsKey: string,
    private readonly appCieloCredentialsUsername: string,
    private readonly appCieloCredentialsPassword: string,
  ) {
    this.logger = logger.child({
      context: CreateCreditTransactionUseCase.name,
    });
  }

  async execute(
    request: CreditTransactionRequest,
  ): Promise<CreditTransactionResponse> {
    this.logger.debug('Receive Cielo transaction data.', request.CheckoutId);

    const checkout = await this.checkoutRepository.getById(request.CheckoutId);

    if (!checkout) {
      throw new NotFoundException('Checkout not found');
    }

    this.logger.debug('Check if checkout exists.', request.CheckoutId);

    this.logger.debug('Create Cielo HTTP request.', { checkout });

    const cieloRequest =
      checkout.payload as CieloCreateCreditTransactionRequest;

    cieloRequest.Payment.CreditCard =
      request.CreditCard as CieloCreditCardCommon;
    cieloRequest.Payment.Credentials = {
      Code: this.appCieloCredentialsCode,
      Key: this.appCieloCredentialsKey,
      Username: this.appCieloCredentialsUsername,
      Password: this.appCieloCredentialsPassword,
    };

    const cieloResponse =
      await this.cieloService.createCreditTransaction(cieloRequest);

    this.logger.debug('Cielo credit card transaction created.', {
      cieloRequest,
    });

    checkout.status = this.getEnumKey(
      CieloTransactionStatusEnum,
      cieloResponse.Payment.Status,
    );

    this.logger.debug('Cielo credit card transaction status updated.', {
      checkout,
    });

    checkout.referenceId = cieloResponse.Payment.PaymentId;

    if (cieloResponse.Payment.AuthorizationCode)
      checkout.authorizationId = cieloResponse.Payment.AuthorizationCode;

    const updatedPayment = await this.checkoutRepository.update(checkout);

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
    if (response.Payment.CreditCard) delete response.Payment.CreditCard;

    const historic: CheckoutHistoric = {
      id: uuid.v4(),
      checkoutId: checkout.id,
      previousStatus: this.getCurrentStatus(checkout),
      currentStatus: this.getEnumKey(
        CieloTransactionStatusEnum,
        response.Payment.Status,
      ),
      action: 'credit',
      response: response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return historic;
  }

  private toResponse(
    status: string,
    checkoutId: string,
  ): CreditTransactionResponse {
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
