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
  ValidateNested,
} from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  WalletEntity,
  UserWalletRepository,
  WalletState,
  WalletRepository,
  UserWallet,
  PermissionType,
} from '@zro/operations/domain';
import {
  GetUserWalletByUserAndWalletUseCase as UseCase,
  UserService,
} from '@zro/operations/application';

type UserId = User['uuid'];
type UserName = User['name'];
type WalletId = Wallet['uuid'];
type PermissionTypeTag = PermissionType['tag'];

type TGetUserWalletByUserAndWalletRequest = {
  userId: UserId;
  walletId: WalletId;
};

export class GetUserWalletByUserAndWalletRequest
  extends AutoValidator
  implements TGetUserWalletByUserAndWalletRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: TGetUserWalletByUserAndWalletRequest) {
    super(props);
  }
}

type TGetUserWalletByUserAndWalletWalletResponse = Pick<
  Wallet,
  'id' | 'uuid' | 'name' | 'state' | 'default' | 'createdAt'
> & { userId: UserId; userName: UserName };

class GetUserWalletByUserAndWalletWalletResponse
  extends AutoValidator
  implements TGetUserWalletByUserAndWalletWalletResponse
{
  @IsPositive()
  @IsInt()
  id: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsUUID(4)
  uuid: string;

  @IsEnum(WalletState)
  state: WalletState;

  @IsBoolean()
  default: boolean;

  @IsUUID(4)
  userId: UserId;

  @IsString()
  @MaxLength(255)
  userName: UserName;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  constructor(props: TGetUserWalletByUserAndWalletWalletResponse) {
    super(props);
  }
}

type TGetUserWalletByUserAndWalletResponse = Pick<UserWallet, 'id'> & {
  userId: UserId;
  permissionTypeTags: PermissionTypeTag[];
  wallet: TGetUserWalletByUserAndWalletWalletResponse;
};

export class GetUserWalletByUserAndWalletResponse
  extends AutoValidator
  implements TGetUserWalletByUserAndWalletResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @ValidateNested()
  wallet: GetUserWalletByUserAndWalletWalletResponse;

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  constructor(props: TGetUserWalletByUserAndWalletResponse) {
    super(props);
  }
}

export class GetUserWalletByUserAndWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
    userWalletRepository: UserWalletRepository,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetUserWalletByUserAndWalletController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletRepository,
      userWalletRepository,
      userService,
    );
  }

  async execute(
    request: GetUserWalletByUserAndWalletRequest,
  ): Promise<GetUserWalletByUserAndWalletResponse> {
    this.logger.debug('Get by UserWallet id request.', { request });

    const { userId, walletId } = request;
    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });

    const result = await this.usecase.execute(user, wallet);

    if (!result) {
      return null;
    }

    const response = new GetUserWalletByUserAndWalletResponse({
      id: result.id,
      userId: result.user.uuid,
      permissionTypeTags: result.permissionTypes.map(({ tag }) => tag),
      wallet: new GetUserWalletByUserAndWalletWalletResponse({
        id: result.wallet.id,
        name: result.wallet.name,
        uuid: result.wallet.uuid,
        state: result.wallet.state,
        default: result.wallet.default,
        userId: result.wallet.user.uuid,
        userName: result.wallet.user.name,
        createdAt: result.wallet.createdAt,
      }),
    });

    this.logger.debug('Get by UserWallet id response.', { response });

    return response;
  }
}
