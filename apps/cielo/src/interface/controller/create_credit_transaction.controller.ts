import {
  CreateCreditTransactionUseCase,
  ICieloService,
} from '@zro/cielo/application';
import { CheckoutRepository } from '@zro/cielo/domain';
import { CheckoutHistoricDatabaseRepository } from '@zro/cielo/infrastructure';
import { AutoValidator } from '@zro/common';
import { IsObject, IsString, IsUUID } from 'class-validator';
import { Logger } from 'winston';

export class CreditCardRequest {
  @IsString()
  CardNumber: string;

  @IsString()
  Holder: string;

  @IsString()
  ExpirationDate: string;

  @IsString()
  SecurityCode: string;

  @IsString()
  Brand: string;
}

export type TCreditTransactionRequest = {
  CheckoutId: string;
  CreditCard: CreditCardRequest;
};

export class CreditTransactionRequest
  extends AutoValidator
  implements TCreditTransactionRequest
{
  @IsString()
  CheckoutId: string;

  @IsObject()
  CreditCard: CreditCardRequest;

  constructor(props: TCreditTransactionRequest) {
    super(props);
  }
}

type TCreditTransactionResponse = {
  CheckoutId: string;
  Status: string;
};

export class CreditTransactionResponse
  extends AutoValidator
  implements TCreditTransactionResponse
{
  @IsUUID(4)
  CheckoutId: string;

  @IsString()
  Status: string;

  constructor(props: TCreditTransactionResponse) {
    super(props);
  }
}

export class CreditTransactionController {
  private usecase: CreateCreditTransactionUseCase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    cieloService: ICieloService,
    appCieloCredentialsCode: string,
    appCieloCredentialsKey: string,
    appCieloCredentialsUsername: string,
    appCieloCredentialsPassword: string,
  ) {
    this.logger = logger.child({
      context: CreditTransactionController.name,
    });

    this.usecase = new CreateCreditTransactionUseCase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
      cieloService,
      appCieloCredentialsCode,
      appCieloCredentialsKey,
      appCieloCredentialsUsername,
      appCieloCredentialsPassword,
    );
  }

  async execute(
    payload: CreditTransactionRequest,
  ): Promise<CreditTransactionResponse> {
    this.logger.debug('Create credit card transaction.', { payload });

    const payment = await this.usecase.execute(payload);

    if (!payment) return null;

    const response = new CreditTransactionResponse({
      CheckoutId: payment.CheckoutId,
      Status: payment.Status,
    });

    this.logger.info('Created Cielo credit card transaction.', {
      payment: response,
    });

    return response;
  }
}
