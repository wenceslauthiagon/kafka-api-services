import { Logger } from 'winston';
import {
  IsUUID,
  IsInt,
  IsDate,
  IsEnum,
  IsString,
  Length,
  IsPositive,
  MaxLength,
  ValidateIf,
  IsIn,
  IsOptional,
} from 'class-validator';
import { AutoValidator, IsCpfOrCnpj } from '@zro/common';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  TransactionType,
  TransactionTypeEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { KeyType, PixKey, PixKeyEntity } from '@zro/pix-keys/domain';
import {
  CreateUserWithdrawSettingRequestUseCase,
  OperationService,
  PixKeyService,
} from '@zro/compliance/application';
import {
  UserWithdrawSettingRequestEventEmitterController,
  UserWithdrawSettingRequestEventEmitterControllerInterface,
} from '@zro/compliance/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type TransactionTypeTag = TransactionType['tag'];

type TCreateUserWithdrawSettingRequest = Pick<
  UserWithdrawSettingRequest,
  'id' | 'type' | 'balance' | 'day' | 'weekDay'
> & {
  walletId: WalletId;
  userId: UserId;
  transactionTypeTag: TransactionTypeTag;
  pixKey: PixKey['key'];
  pixKeyType: PixKey['type'];
  pixKeyDocument?: PixKey['document'];
};

export class CreateUserWithdrawSettingRequest
  extends AutoValidator
  implements TCreateUserWithdrawSettingRequest
{
  @IsUUID(4)
  id: string;

  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @IsInt()
  @IsPositive()
  balance: number;

  @ValidateIf(
    (body: CreateUserWithdrawSettingRequest) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ValidateIf(
    (body: CreateUserWithdrawSettingRequest) =>
      body.type === WithdrawSettingType.WEEKLY,
  )
  @IsEnum(WithdrawSettingWeekDays)
  weekDay?: WithdrawSettingWeekDays;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @Length(1, 255)
  transactionTypeTag: TransactionTypeTag;

  @IsString()
  @MaxLength(77)
  pixKey: PixKey['key'];

  @IsEnum(KeyType)
  pixKeyType: PixKey['type'];

  @IsOptional()
  @IsCpfOrCnpj()
  pixKeyDocument?: PixKey['document'];

  constructor(props: TCreateUserWithdrawSettingRequest) {
    super(props);
  }
}

type TCreateUserWithdrawSettingRequestResponse = Pick<
  UserWithdrawSettingRequest,
  | 'id'
  | 'state'
  | 'type'
  | 'balance'
  | 'day'
  | 'weekDay'
  | 'createdAt'
  | 'updatedAt'
> & {
  walletId: WalletId;
  transactionTypeTag: TransactionTypeTag;
  pixKey: PixKey['key'];
  pixKeyType: PixKey['type'];
  pixKeyDocument?: PixKey['document'];
};

export class CreateUserWithdrawSettingRequestResponse
  extends AutoValidator
  implements TCreateUserWithdrawSettingRequestResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(UserWithdrawSettingRequestState)
  state: UserWithdrawSettingRequestState;

  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @IsUUID(4)
  walletId: WalletId;

  @IsInt()
  @IsPositive()
  balance: number;

  @ValidateIf(
    (body: CreateUserWithdrawSettingRequestResponse) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ValidateIf(
    (body: CreateUserWithdrawSettingRequestResponse) =>
      body.type === WithdrawSettingType.WEEKLY,
  )
  @IsEnum(WithdrawSettingWeekDays)
  weekDay?: WithdrawSettingWeekDays;

  @IsString()
  @Length(1, 255)
  transactionTypeTag: TransactionTypeTag;

  @IsString()
  @MaxLength(77)
  pixKey: PixKey['key'];

  @IsEnum(KeyType)
  pixKeyType: PixKey['type'];

  @IsOptional()
  @IsCpfOrCnpj()
  pixKeyDocument?: PixKey['document'];

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  constructor(props: TCreateUserWithdrawSettingRequestResponse) {
    super(props);
  }
}

export class CreateUserWithdrawSettingRequestController {
  private usecase: CreateUserWithdrawSettingRequestUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository,
    operationService: OperationService,
    pixKeyService: PixKeyService,
    eventEmitter: UserWithdrawSettingRequestEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateUserWithdrawSettingRequestController.name,
    });

    const controllerUserWithdrawSettingRequestEventEmitter =
      new UserWithdrawSettingRequestEventEmitterController(eventEmitter);

    this.usecase = new CreateUserWithdrawSettingRequestUseCase(
      this.logger,
      userWithdrawSettingRequestRepository,
      operationService,
      pixKeyService,
      controllerUserWithdrawSettingRequestEventEmitter,
    );
  }

  async execute(
    request: CreateUserWithdrawSettingRequest,
  ): Promise<CreateUserWithdrawSettingRequestResponse> {
    this.logger.debug('Create user withdraw setting request.', { request });

    const {
      id,
      type,
      balance,
      day,
      weekDay,
      walletId,
      userId,
      transactionTypeTag,
      pixKey: key,
      pixKeyType,
      pixKeyDocument,
    } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const user = new UserEntity({ uuid: userId });
    const transactionType = new TransactionTypeEntity({
      tag: transactionTypeTag,
    });

    const pixKey = new PixKeyEntity({
      key,
      type: pixKeyType,
      ...(pixKeyDocument && { document: pixKeyDocument }),
    });

    const result = await this.usecase.execute(
      id,
      type,
      balance,
      day,
      weekDay,
      wallet,
      user,
      transactionType,
      pixKey,
    );

    const response = new CreateUserWithdrawSettingRequestResponse({
      id: result.id,
      state: result.state,
      type: result.type,
      balance: result.balance,
      day: result.day,
      weekDay: result.weekDay,
      walletId: result.wallet.uuid,
      transactionTypeTag: result.transactionType.tag,
      pixKey: result.pixKey.key,
      pixKeyType: result.pixKey.type,
      pixKeyDocument: result.pixKey.document,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    this.logger.info('Create user withdraw setting request response.', {
      response,
    });

    return response;
  }
}
