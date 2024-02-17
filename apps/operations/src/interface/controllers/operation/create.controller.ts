import { Logger } from 'winston';
import {
  IsBoolean,
  IsEnum,
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
  CurrencyEntity,
  CurrencyRepository,
  GlobalLimitRepository,
  LimitTypeRepository,
  Operation,
  OperationEntity,
  OperationRepository,
  OperationState,
  OperationStreamQuotationRepository,
  PendingWalletAccountTransactionRepository,
  TransactionType,
  TransactionTypeRepository,
  UserLimitRepository,
  UserLimitTrackerRepository,
  Wallet,
  WalletAccountCacheRepository,
  WalletAccountRepository,
  WalletEntity,
  WalletRepository,
} from '@zro/operations/domain';
import {
  CreateOperationParticipant,
  CreateOperationUseCase,
} from '@zro/operations/application';
import {
  OperationEventEmitterController,
  OperationEventEmitterControllerInterface,
  UserLimitEventEmitterController,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';

type TUserInfoRequest = Pick<Operation, 'rawValue' | 'fee' | 'description'> & {
  operationId: Operation['id'];
  walletId: Wallet['uuid'];
  currencyTag: Currency['tag'];
  ownerAllowAvailableRawValue?: boolean;
};

export class UserInfoRequest extends AutoValidator implements TUserInfoRequest {
  @IsUUID(4)
  operationId: string;

  @IsUUID(4)
  walletId: string;

  @IsString()
  @MaxLength(255)
  currencyTag: string;

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

  @IsBoolean()
  @IsOptional()
  ownerAllowAvailableRawValue?: boolean;

  constructor(props: TUserInfoRequest) {
    super(props);
  }
}

type TCreateOperationRequest = {
  owner?: TUserInfoRequest;
  beneficiary?: TUserInfoRequest;
  transactionTag: TransactionType['tag'];
};

export class CreateOperationRequest
  extends AutoValidator
  implements TCreateOperationRequest
{
  @IsOptional()
  @ValidateNested()
  owner?: UserInfoRequest;

  @IsOptional()
  @ValidateNested()
  beneficiary?: UserInfoRequest;

  @IsString()
  transactionTag: string;

  constructor(props: TCreateOperationRequest) {
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

type TCreateOperationResponse = {
  owner?: TOperationResponse;
  beneficiary?: TOperationResponse;
};

export class CreateOperationResponse
  extends AutoValidator
  implements TCreateOperationResponse
{
  @IsOptional()
  @ValidateNested()
  owner?: OperationResponse;

  @IsOptional()
  @ValidateNested()
  beneficiary?: OperationResponse;

  constructor(props: TCreateOperationResponse) {
    super(props);
    this.owner = props.owner && new OperationResponse(props.owner);
    this.beneficiary =
      props.beneficiary && new OperationResponse(props.beneficiary);
  }
}

export class CreateOperationController {
  private readonly usecase: CreateOperationUseCase;

  /**
   * Default constructor.
   * @param logger Logger service.
   * @param walletRepository Wallet repository.
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
    walletAccountCacheRepository: WalletAccountCacheRepository,
    operationStreamQuotationRepository: OperationStreamQuotationRepository,
    pendingWalletAccountTransactionRepository: PendingWalletAccountTransactionRepository,
    serviceEventEmitter: OperationEventEmitterControllerInterface,
    operationSymbolCurrencyReal: string,
    pendingWalletAccountTransactionTTL: number,
    userLimitServiceEventEmitter: UserLimitEventEmitterControllerInterface,
    userLimitTrackerRepository: UserLimitTrackerRepository,
  ) {
    this.logger = logger.child({ context: CreateOperationController.name });

    const eventEmitter = new OperationEventEmitterController(
      serviceEventEmitter,
    );

    const userLimitEventEmitter = new UserLimitEventEmitterController(
      userLimitServiceEventEmitter,
    );

    this.usecase = new CreateOperationUseCase(
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
      eventEmitter,
      operationSymbolCurrencyReal,
      pendingWalletAccountTransactionTTL,
      userLimitEventEmitter,
      userLimitTrackerRepository,
    );
  }

  /**
   * Create operation.
   *
   * @param request Input data.
   * @returns Wallet account if found or null otherwise.
   *
   * @throws {MissingDataException} If any parameter is missing.
   */
  async execute(
    request: CreateOperationRequest,
  ): Promise<CreateOperationResponse> {
    this.logger.debug('Create operation request.', { request });

    const { transactionTag, owner, beneficiary } = request;

    let ownerInfo: CreateOperationParticipant = null;

    if (owner) {
      ownerInfo = {
        currency: new CurrencyEntity({ tag: owner.currencyTag }),
        wallet: new WalletEntity({ uuid: owner.walletId }),
        operation: new OperationEntity({ id: owner.operationId }),
        description: owner.description,
        fee: owner.fee,
        rawValue: owner.rawValue,
        ownerAllowAvailableRawValue: owner.ownerAllowAvailableRawValue ?? false,
      };
    }

    let beneficiaryInfo: CreateOperationParticipant = null;

    if (beneficiary) {
      beneficiaryInfo = {
        currency: new CurrencyEntity({ tag: beneficiary.currencyTag }),
        wallet: new WalletEntity({ uuid: beneficiary.walletId }),
        operation: new OperationEntity({ id: beneficiary.operationId }),
        description: beneficiary.description,
        fee: beneficiary.fee,
        rawValue: beneficiary.rawValue,
        ownerAllowAvailableRawValue:
          beneficiary.ownerAllowAvailableRawValue ?? false,
      };
    }

    const createdOperation = await this.usecase.execute(
      transactionTag,
      ownerInfo,
      beneficiaryInfo,
    );

    return this.createOperationPresenter(
      createdOperation.ownerOperation,
      createdOperation.beneficiaryOperation,
    );
  }

  /**
   * Create an DTO for an operation.
   *
   * @param operation Created operation.
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
   * Create DTO response for create operation call.
   *
   * @param owner Operation owner.
   * @param beneficiary Operation beneficiary.
   * @returns Create operation response.
   */
  private createOperationPresenter(
    owner?: Operation,
    beneficiary?: Operation,
  ): CreateOperationResponse {
    const createdOwner = this.operationPresenter(owner);
    const createdBeneficiary = this.operationPresenter(beneficiary);

    return new CreateOperationResponse({
      owner: createdOwner,
      beneficiary: createdBeneficiary,
    });
  }
}
