import {
  CreateNonAuthenticatedDebitTransactionUsecase,
  ICieloService,
} from '@zro/cielo/application';
import { CheckoutRepository } from '@zro/cielo/domain';
import {
  CheckoutHistoricDatabaseRepository,
  CieloDebitCardCommon,
} from '@zro/cielo/infrastructure';
import { AutoValidator } from '@zro/common';
import { IsObject, IsString, IsUUID } from 'class-validator';
import { Logger } from 'winston';

export type TNonAuthenticatedDebitTransactionRequest = {
  CheckoutId: string;
  DebitCard: CieloDebitCardCommon;
};

export class NonAuthenticatedDebitTransactionRequest
  extends AutoValidator
  implements TNonAuthenticatedDebitTransactionRequest
{
  @IsString()
  CheckoutId: string;

  @IsObject()
  DebitCard: CieloDebitCardCommon;

  constructor(props: TNonAuthenticatedDebitTransactionRequest) {
    super(props);
  }
}

type TNonAuthenticatedDebitTransactionResponse = {
  CheckoutId: string;
  Status: string;
};

export class NonAuthenticatedDebitTransactionResponse
  extends AutoValidator
  implements TNonAuthenticatedDebitTransactionResponse
{
  @IsUUID(4)
  CheckoutId: string;

  @IsString()
  Status: string;

  constructor(props: TNonAuthenticatedDebitTransactionResponse) {
    super(props);
    this.CheckoutId = props.CheckoutId;
    this.Status = props.Status;
  }
}

export class CreateNonAuthenticatedDebitTransactionController {
  private usecase: CreateNonAuthenticatedDebitTransactionUsecase;

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
      context: CreateNonAuthenticatedDebitTransactionController.name,
    });

    this.usecase = new CreateNonAuthenticatedDebitTransactionUsecase(
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
    payload: NonAuthenticatedDebitTransactionRequest,
  ): Promise<NonAuthenticatedDebitTransactionResponse> {
    this.logger.debug('Create non authenticated debit transaction.', {
      payload,
    });

    const payment = await this.usecase.execute(payload);

    if (!payment) return null;

    this.logger.info(
      'Create Cielo non authenticated debit transaction response.',
      {
        payment,
      },
    );

    return payment;
  }
}
