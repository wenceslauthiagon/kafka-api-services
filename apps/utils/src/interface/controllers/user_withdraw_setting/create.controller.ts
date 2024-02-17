import { Logger } from 'winston';
import { AutoValidator } from '@zro/common';
import {
  UserWithdrawSetting,
  UserWithdrawSettingRepository,
  WithdrawSettingState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  TransactionType,
  TransactionTypeEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { KeyType, PixKey, PixKeyEntity } from '@zro/pix-keys/domain';
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
} from 'class-validator';
import { CreateUserWithdrawSettingUseCase } from '@zro/utils/application';
import {
  UserWithdrawSettingEventEmitterController,
  UserWithdrawSettingEventEmitterControllerInterface,
} from '@zro/utils/interface';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];
type TransactionTypeTag = TransactionType['tag'];

type TCreateUserWithdrawSettingRequest = Pick<
  UserWithdrawSetting,
  'id' | 'type' | 'balance' | 'day' | 'weekDay'
> & {
  walletId: WalletId;
  userId: UserId;
  transactionTypeTag: TransactionTypeTag;
  pixKey: PixKey['key'];
  pixKeyType: PixKey['type'];
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

  constructor(props: TCreateUserWithdrawSettingRequest) {
    super(props);
  }
}

type TCreateUserWithdrawSettingResponse = Pick<
  UserWithdrawSetting,
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
};

export class CreateUserWithdrawSettingResponse
  extends AutoValidator
  implements TCreateUserWithdrawSettingResponse
{
  @IsUUID(4)
  id: string;

  @IsEnum(WithdrawSettingState)
  state: WithdrawSettingState;

  @IsEnum(WithdrawSettingType)
  type: WithdrawSettingType;

  @IsUUID(4)
  walletId: WalletId;

  @IsInt()
  @IsPositive()
  balance: number;

  @ValidateIf(
    (body: CreateUserWithdrawSettingResponse) =>
      body.type === WithdrawSettingType.MONTHLY,
  )
  @IsInt()
  @IsPositive()
  @IsIn([5, 15, 25])
  day?: number;

  @ValidateIf(
    (body: CreateUserWithdrawSettingResponse) =>
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

  @IsDate()
  createdAt: Date;

  @IsDate()
  updatedAt: Date;

  constructor(props: TCreateUserWithdrawSettingResponse) {
    super(props);
  }
}

export class CreateUserWithdrawSettingController {
  private usecase: CreateUserWithdrawSettingUseCase;

  constructor(
    private logger: Logger,
    userWithdrawSettingRepository: UserWithdrawSettingRepository,
    eventEmitter: UserWithdrawSettingEventEmitterControllerInterface,
  ) {
    this.logger = logger.child({
      context: CreateUserWithdrawSettingController.name,
    });

    const controllerUserWithdrawSettingEventEmitter =
      new UserWithdrawSettingEventEmitterController(eventEmitter);

    this.usecase = new CreateUserWithdrawSettingUseCase(
      this.logger,
      userWithdrawSettingRepository,
      controllerUserWithdrawSettingEventEmitter,
    );
  }

  async execute(
    request: CreateUserWithdrawSettingRequest,
  ): Promise<CreateUserWithdrawSettingResponse> {
    this.logger.debug('Create user withdraw setting.', { request });

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
    } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const user = new UserEntity({ uuid: userId });
    const transactionType = new TransactionTypeEntity({
      tag: transactionTypeTag,
    });

    const pixKey = new PixKeyEntity({
      key,
      type: pixKeyType,
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

    const response = new CreateUserWithdrawSettingResponse({
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
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });

    this.logger.debug('Create user withdraw setting response.', {
      response,
    });

    return response;
  }
}
