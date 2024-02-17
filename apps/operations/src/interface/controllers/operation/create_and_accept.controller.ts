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
  CurrencyRepository,
  GlobalLimitRepository,
  LimitTypeRepository,
  Operation,
  OperationRepository,
  OperationState,
  OperationStreamQuotationRepository,
  PendingWalletAccountTransactionRepository,
  TransactionType,
  TransactionTypeRepository,
  UserLimitRepository,
  UserLimitTrackerRepository,
  Wallet,
  WalletAccount,
  WalletAccountCacheRepository,
  WalletAccountRepository,
  WalletAccountTransaction,
  WalletAccountTransactionRepository,
  WalletAccountTransactionType,
  WalletRepository,
} from '@zro/operations/domain';
import {
  UserInfoRequest,
  CreateOperationController,
  AcceptOperationController,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

type TCreateAndAcceptOperationRequest = {
  owner?: UserInfoRequest;
  beneficiary?: UserInfoRequest;
  transactionTag: TransactionType['tag'];
};

export class CreateAndAcceptOperationRequest
  extends AutoValidator
  implements TCreateAndAcceptOperationRequest
{
  @IsOptional()
  @ValidateNested()
  owner?: UserInfoRequest;

  @IsOptional()
  @ValidateNested()
  beneficiary?: UserInfoRequest;

  @IsString()
  transactionTag: string;

  constructor(props: TCreateAndAcceptOperationRequest) {
    super(
      Object.assign({}, props, {
        owner: props.owner && new UserInfoRequest(props.owner),
        beneficiary:
          props.beneficiary && new UserInfoRequest(props.beneficiary),
      }),
    );
  }
}

type TOperationResponse = Pick<
  Operation,
  'id' | 'state' | 'rawValue' | 'fee' | 'value' | 'description' | 'createdAt'
> & {
  transactionId: TransactionType['id'];
  operationRefId?: Operation['id'];
};

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

class AcceptOperationResponse
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

type TCreateAndAcceptOperationResponse = {
  owner?: TAcceptOperationResponse;
  beneficiary?: TAcceptOperationResponse;
};

export class CreateAndAcceptOperationResponse
  extends AutoValidator
  implements TCreateAndAcceptOperationResponse
{
  @IsOptional()
  @ValidateNested()
  owner?: AcceptOperationResponse;

  @IsOptional()
  @ValidateNested()
  beneficiary?: AcceptOperationResponse;

  constructor(props: TCreateAndAcceptOperationResponse) {
    super(
      Object.assign(
        {},
        props,
        props.owner && { owner: new AcceptOperationResponse(props.owner) },
        props.beneficiary && {
          beneficiary: new AcceptOperationResponse(props.beneficiary),
        },
      ),
    );
  }
}

export class CreateAndAcceptOperationController {
  private readonly createController: CreateOperationController;
  private readonly acceptController: AcceptOperationController;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletAccountRepository Wallet account repository.
   * @param currencyRepository Currency repository.
   */
  constructor(
    private readonly logger: Logger,
    transactionTypeRepository: TransactionTypeRepository,
    currencyRepository: CurrencyRepository,
    walletRepository: WalletRepository,
    walletAccountRepository: WalletAccountRepository,
    operationRepository: OperationRepository,
    limitTypeRepository: LimitTypeRepository,
    userLimitRepository: UserLimitRepository,
    globalLimitRepository: GlobalLimitRepository,
    walletAccountTransactionRepository: WalletAccountTransactionRepository,
    walletAccountCacheRepository: WalletAccountCacheRepository,
    operationStreamQuotationRepository: OperationStreamQuotationRepository,
    pendingWalletAccountTransactionRepository: PendingWalletAccountTransactionRepository,
    serviceEventEmitter: OperationEventEmitterControllerInterface,
    operationSymbolCurrencyReal: string,
    pendingWalletAccountTransactionTTL: number,
    userLimitServiceEventEmitter: UserLimitEventEmitterControllerInterface,
    userLimitTrackerRepository: UserLimitTrackerRepository,
  ) {
    this.logger = logger.child({
      context: CreateAndAcceptOperationController.name,
    });

    this.createController = new CreateOperationController(
      this.logger,
      transactionTypeRepository,
      currencyRepository,
      walletRepository,
      walletAccountRepository,
      operationRepository,
      limitTypeRepository,
      userLimitRepository,
      globalLimitRepository,
      walletAccountCacheRepository,
      operationStreamQuotationRepository,
      pendingWalletAccountTransactionRepository,
      serviceEventEmitter,
      operationSymbolCurrencyReal,
      pendingWalletAccountTransactionTTL,
      userLimitServiceEventEmitter,
      userLimitTrackerRepository,
    );

    this.acceptController = new AcceptOperationController(
      this.logger,
      operationRepository,
      walletAccountRepository,
      walletAccountTransactionRepository,
      serviceEventEmitter,
    );
  }

  /**
   * Create and accept an operation.
   *
   * @param request Input data.
   * @returns Wallet account if found or null otherwise.
   */
  async execute(
    request: CreateAndAcceptOperationRequest,
  ): Promise<CreateAndAcceptOperationResponse> {
    this.logger.debug('Create and accept operation request.', { request });

    const { owner, beneficiary } = await this.createController.execute(request);

    let acceptedOwner: AcceptOperationResponse = null;
    let acceptedBeneficiary: AcceptOperationResponse = null;

    if (owner && beneficiary) {
      if (owner.id === beneficiary.id) {
        acceptedOwner = await this.acceptController.execute(owner);
        acceptedBeneficiary = acceptedOwner;
      } else {
        acceptedOwner = await this.acceptController.execute(owner);
        acceptedBeneficiary = await this.acceptController.execute(beneficiary);
      }
    } else if (owner) {
      acceptedOwner = await this.acceptController.execute(owner);
    } else if (beneficiary) {
      acceptedBeneficiary = await this.acceptController.execute(beneficiary);
    }

    return new CreateAndAcceptOperationResponse({
      owner: acceptedOwner,
      beneficiary: acceptedBeneficiary,
    });
  }
}
