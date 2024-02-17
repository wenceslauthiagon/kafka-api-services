import * as uuid from 'uuid';
import {
  Checkout,
  CheckoutRepository,
  CheckoutHistoric,
} from '@zro/cielo/domain';

import { ICieloService } from '@zro/cielo/application';
import { Logger } from 'winston';
import {
  CheckoutHistoricDatabaseRepository,
  CieloCreateAuthenticatedDebitTransactionRequest,
  CieloDebitCardCommon,
  CieloExternalAuthenticationCommon,
  CieloTransactionStatusEnum,
} from '@zro/cielo/infrastructure';
import {
  AuthenticatedDebitTransactionRequest,
  AuthenticatedDebitTransactionResponse,
} from '@zro/cielo/interface';

export class CreateAuthenticatedDebitTransactionUsecase {
  constructor(
    private logger: Logger,
    private readonly checkoutRepository: CheckoutRepository,
    private readonly checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    private readonly cieloService: ICieloService,
  ) {
    this.logger = logger.child({
      context: CreateAuthenticatedDebitTransactionUsecase.name,
    });
  }

  async execute(
    request: AuthenticatedDebitTransactionRequest,
  ): Promise<AuthenticatedDebitTransactionResponse> {
    this.logger.debug('Receive Cielo transaction data.', request.CheckoutId);

    const checkout = await this.checkoutRepository.getById(request.CheckoutId);

    this.logger.debug('Create Cielo HTTP request.', { checkout });

    const cieloRequest =
      checkout.payload as CieloCreateAuthenticatedDebitTransactionRequest;

    cieloRequest.Payment.DebitCard = request.DebitCard as CieloDebitCardCommon;
    cieloRequest.Payment.ExternalAuthentication =
      request.ExternalAuthentication as CieloExternalAuthenticationCommon;

    const cieloResponse =
      await this.cieloService.createAuthenticatedDebitTransaction(cieloRequest);

    this.logger.debug('Cielo 3DS authenticated debit transaction created.', {
      cieloRequest,
    });

    checkout.status = this.getEnumKey(
      CieloTransactionStatusEnum,
      cieloResponse.Payment.Status,
    );

    this.logger.debug(
      'Cielo 3DS authenticated debit transaction status updated.',
      {
        checkout,
      },
    );

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
    response.Payment.DebitCard = response.DebitCard as CieloDebitCardCommon;

    const historic: CheckoutHistoric = {
      id: uuid.v4(),
      checkoutId: checkout.id,
      previousStatus: this.getCurrentStatus(checkout),
      currentStatus: this.getEnumKey(
        CieloTransactionStatusEnum,
        response.Payment.Status,
      ),
      action: '3DS authenticated debit',
      response: response,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return historic;
  }

  private toResponse(
    status: string,
    checkoutId: string,
  ): AuthenticatedDebitTransactionResponse {
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
