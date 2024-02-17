import { Logger } from 'winston';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import {
  Currency,
  Operation,
  OperationRepository,
  OperationState,
  TransactionType,
  Wallet,
  WalletAccount,
  WalletAccountRepository,
  WalletAccountTransaction,
  WalletAccountTransactionRepository,
  WalletAccountTransactionType,
} from '@zro/operations/domain';
import { AcceptOperationUseCase } from '@zro/operations/application';
import {
  OperationEventEmitterController,
  OperationEventEmitterControllerInterface,
} from '@zro/operations/interface';

type TAcceptOperationRequest = Pick<Operation, 'id'>;

export class AcceptOperationRequest
  extends AutoValidator
  implements TAcceptOperationRequest
{
  @IsUUID(4)
  id: string;

  constructor(props: TAcceptOperationRequest) {
    super(props);
  }
}

type TOperationResponse = Pick<
  Operation,
  'id' | 'state' | 'rawValue' | 'fee' | 'value' | 'description' | 'createdAt'
> & { transactionId: TransactionType['id']; operationRefId?: Operation['id'] };

class OperationResponse extends AutoValidator implements TOperationResponse {
  @IsUUID(4)
  id: string;

  @IsEnum(OperationState)
  state: OperationState;

  @IsInt()
  @Min(0)
  rawValue: number;
  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsString()
  @MaxLength(140)
  description: string;

  @IsInt()
  @Min(0)
  value: number;

  @IsInt()
  @IsPositive()
  transactionId: number;

  @IsOptional()
  @IsUUID(4)
  operationRefId?: string;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TOperationResponse) {
    super(props);
  }
}

type TWalletAccountResponse = Pick<
  WalletAccount,
  'id' | 'balance' | 'pendingAmount'
> & { walletId: Wallet['id']; currencyId: Currency['id'] };

class WalletAccountResponse
  extends AutoValidator
  implements TWalletAccountResponse
{
  @IsInt()
  @IsPositive()
  id: number;

  @IsInt()
  balance?: number;

  @IsInt()
  pendingAmount?: number;

  @IsInt()
  @IsPositive()
  walletId: number;

  @IsInt()
  @IsPositive()
  currencyId: number;

  constructor(props: TWalletAccountResponse) {
    super(props);
  }
}

const walletAccountTransactionMapType = {
  [WalletAccountTransactionType.CREDIT]: 'CREDIT',
  [WalletAccountTransactionType.DEBIT]: 'DEBIT',
};

type TWalletAccountTransactionResponse = Pick<
  WalletAccountTransaction,
  'id' | 'value' | 'previousBalance' | 'updatedBalance' | 'createdAt'
> & {
  walletAccountId: WalletAccount['id'];
  operationId: Operation['id'];
  transactionType: string;
};

class WalletAccountTransactionResponse
  extends AutoValidator
  implements TWalletAccountTransactionResponse
{
  @IsUUID(4)
  id: string;

  @IsInt()
  value: number;

  @IsInt()
  previousBalance: number;

  @IsInt()
  updatedBalance: number;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsInt()
  @IsPositive()
  walletAccountId: number;

  @IsUUID(4)
  operationId: string;

  @IsIn(Object.values(walletAccountTransactionMapType))
  transactionType: string;

  constructor(props: TWalletAccountTransactionResponse) {
    super(props);
  }
}

type TAcceptOperationResponse = {
  operation: TOperationResponse;
  debitWalletAccount?: TWalletAccountResponse;
  debitWalletAccountTransaction?: TWalletAccountTransactionResponse;
  creditWalletAccount?: TWalletAccountResponse;
  creditWalletAccountTransaction?: TWalletAccountTransactionResponse;
};

export class AcceptOperationResponse
  extends AutoValidator
  implements TAcceptOperationResponse
{
  @ValidateNested()
  operation: OperationResponse;

  @IsOptional()
  @ValidateNested()
  debitWalletAccount?: WalletAccountResponse;

  @IsOptional()
  @ValidateNested()
  debitWalletAccountTransaction?: WalletAccountTransactionResponse;

  @IsOptional()
  @ValidateNested()
  creditWalletAccount?: WalletAccountResponse;

  @IsOptional()
  @ValidateNested()
  creditWalletAccountTransaction?: WalletAccountTransactionResponse;

  constructor(props: TAcceptOperationResponse) {
    super(
      Object.assign(
        {},
        props,
        { operation: new OperationResponse(props.operation) },
        props.debitWalletAccount &&
          props.debitWalletAccountTransaction && {
            debitWalletAccount: new WalletAccountResponse(
              props.debitWalletAccount,
            ),
            debitWalletAccountTransaction: new WalletAccountTransactionResponse(
              props.debitWalletAccountTransaction,
            ),
          },
        props.creditWalletAccount &&
          props.creditWalletAccountTransaction && {
            creditWalletAccount: new WalletAccountResponse(
              props.creditWalletAccount,
            ),
            creditWalletAccountTransaction:
              new WalletAccountTransactionResponse(
                props.creditWalletAccountTransaction,
              ),
          },
      ),
    );
  }
}

export class AcceptOperationController {
  private usecase: AcceptOperationUseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   */
  constructor(
    private logger: Logger,
    operationRepository: OperationRepository,
    walletAccountRepository: WalletAccountRepository,
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    serviceEventEmitter: OperationEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({ context: AcceptOperationController.name });

    const eventEmitter = new OperationEventEmitterController(
      serviceEventEmitter,
    );

    this.usecase = new AcceptOperationUseCase(
      this.logger,
      operationRepository,
      walletAccountRepository,
      walletAccountTransactionRepository,
      eventEmitter,
    );
  }

  async execute(
    request: AcceptOperationRequest,
  ): Promise<AcceptOperationResponse> {
    this.logger.debug('Accept operation request.', { request });

    const { id } = request;

    const result = await this.usecase.execute(id);

    return this.acceptOperationPresenter(
      result.operation,
      result.debitWalletAccount,
      result.debitWalletAccountTransaction,
      result.creditWalletAccount,
      result.creditWalletAccountTransaction,
    );
  }

  /**
   * Create an DTO for an operation.
   *
   * @param operation Operation.
   * @returns Operation DTO.
   */
  private operationPresenter(operation: Operation): OperationResponse {
    if (!operation) return null;

    return new OperationResponse({
      id: operation.id,
      state: operation.state,
      transactionId: operation.transactionType.id,
      rawValue: operation.rawValue,
      fee: operation.fee,
      value: operation.value,
      description: operation.description,
      operationRefId: operation.operationRef?.id,
      createdAt: operation.createdAt,
    });
  }

  /**
   * Create an DTO for a wallet account.
   *
   * @param walletAccount Wallet account.
   * @returns Wallet account DTO.
   */
  private walletAccountPresenter(
    walletAccount: WalletAccount,
  ): WalletAccountResponse {
    if (!walletAccount) return null;

    return new WalletAccountResponse({
      id: walletAccount.id,
      balance: walletAccount.balance,
      pendingAmount: walletAccount.pendingAmount,
      walletId: walletAccount.wallet.id,
      currencyId: walletAccount.currency.id,
    });
  }

  /**
   * Create an DTO for a wallet account transaction.
   *
   * @param walletAccountTransaction Wallet account transaction.
   * @returns Wallet account transaction DTO.
   */
  private walletAccountTransactionPresenter(
    walletAccountTransaction: WalletAccountTransaction,
  ): WalletAccountTransactionResponse {
    if (!walletAccountTransaction) return null;

    return new WalletAccountTransactionResponse({
      id: walletAccountTransaction.id,
      walletAccountId: walletAccountTransaction.walletAccount.id,
      operationId: walletAccountTransaction.operation.id,
      transactionType:
        walletAccountTransaction.transactionType ===
        WalletAccountTransactionType.CREDIT
          ? 'CREDIT'
          : 'DEBIT',
      value: walletAccountTransaction.value,
      previousBalance: walletAccountTransaction.previousBalance,
      updatedBalance: walletAccountTransaction.updatedBalance,
      createdAt: walletAccountTransaction.createdAt,
    });
  }

  private acceptOperationPresenter(
    operation: Operation,
    debitWalletAccount?: WalletAccount,
    debitWalletAccountTransaction?: WalletAccountTransaction,
    creditWalletAccount?: WalletAccount,
    creditWalletAccountTransaction?: WalletAccountTransaction,
  ): AcceptOperationResponse {
    const acceptedDebitWalletAccount =
      this.walletAccountPresenter(debitWalletAccount);
    const acceptedDebitWalletAccountTransaction =
      this.walletAccountTransactionPresenter(debitWalletAccountTransaction);

    const acceptedCreditWalletAccount =
      this.walletAccountPresenter(creditWalletAccount);
    const acceptedCreditWalletAccountTransaction =
      this.walletAccountTransactionPresenter(creditWalletAccountTransaction);

    return new AcceptOperationResponse({
      operation: this.operationPresenter(operation),
      debitWalletAccount: acceptedDebitWalletAccount,
      debitWalletAccountTransaction: acceptedDebitWalletAccountTransaction,
      creditWalletAccount: acceptedCreditWalletAccount,
      creditWalletAccountTransaction: acceptedCreditWalletAccountTransaction,
    });
  }
}
