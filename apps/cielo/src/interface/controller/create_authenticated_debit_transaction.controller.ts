import {
  CreateAuthenticatedDebitTransactionUsecase,
  ICieloService,
} from '@zro/cielo/application';
import { CheckoutRepository } from '@zro/cielo/domain';
import { CheckoutHistoricDatabaseRepository } from '@zro/cielo/infrastructure';
import { AutoValidator } from '@zro/common';
import { IsObject, IsString, IsUUID } from 'class-validator';
import { Logger } from 'winston';

class ExternalAuthenticationRequest {
  @IsString()
  Cavv: string;

  @IsString()
  Xid: string;

  @IsString()
  Eci: string;

  @IsString()
  Version: string;

  @IsUUID(4)
  ReferenceId: string;
}

class DebitCardRequest {
  @IsString()
  CardNumber: string;

  @IsString()
  Holder: string;

  @IsString()
  ExpirationDate: string;

  @IsString()
  Brand: string;
}

type TAuthenticatedDebitTransactionRequest = {
  CheckoutId: string;
  DebitCard: DebitCardRequest;
};

export class AuthenticatedDebitTransactionRequest
  extends AutoValidator
  implements TAuthenticatedDebitTransactionRequest
{
  @IsUUID(4)
  CheckoutId: string;

  @IsObject()
  DebitCard: DebitCardRequest;

  @IsObject()
  ExternalAuthentication: ExternalAuthenticationRequest;

  constructor(props: TAuthenticatedDebitTransactionRequest) {
    super(props);
  }
}

type TAuthenticatedDebitTransactionResponse = {
  CheckoutId: string;
  Status: string;
};

export class AuthenticatedDebitTransactionResponse
  extends AutoValidator
  implements TAuthenticatedDebitTransactionResponse
{
  @IsUUID(4)
  CheckoutId: string;

  @IsString()
  Status: string;

  constructor(props: TAuthenticatedDebitTransactionResponse) {
    super(props);
  }
}

export class CreateAuthenticatedDebitTransactionController {
  private usecase: CreateAuthenticatedDebitTransactionUsecase;

  constructor(
    private logger: Logger,
    checkoutRepository: CheckoutRepository,
    checkoutHistoricRepository: CheckoutHistoricDatabaseRepository,
    cieloService: ICieloService,
  ) {
    this.logger = logger.child({
      context: CreateAuthenticatedDebitTransactionController.name,
    });

    this.usecase = new CreateAuthenticatedDebitTransactionUsecase(
      logger,
      checkoutRepository,
      checkoutHistoricRepository,
      cieloService,
    );
  }

  async execute(
    payload: AuthenticatedDebitTransactionRequest,
  ): Promise<AuthenticatedDebitTransactionResponse> {
    this.logger.debug('Create 3DS authenticated debit transaction.', {
      payload,
    });

    const response = await this.usecase.execute(payload);

    if (!response) return null;

    this.logger.info(
      'Create Cielo 3DS authenticated debit transaction response.',
      {
        response,
      },
    );

    return response;
  }
}
