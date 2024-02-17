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
  UserWalletRepository,
  WalletState,
  WalletRepository,
  UserWallet,
  PermissionType,
} from '@zro/operations/domain';
import {
  GetAllUserWalletByUserUseCase as UseCase,
  UserService,
  OwnerType,
} from '@zro/operations/application';

type UserId = User['uuid'];
type UserName = User['name'];
type PermissionTypeTag = PermissionType['tag'];

type TGetAllUserWalletByUserRequest = { userId: UserId; owner?: OwnerType };

export class GetAllUserWalletByUserRequest
  extends AutoValidator
  implements TGetAllUserWalletByUserRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsOptional()
  @IsEnum(OwnerType)
  owner?: OwnerType;

  constructor(props: GetAllUserWalletByUserRequest) {
    super(props);
  }
}

type TGetAllUserWalletByUserWalletResponse = Pick<
  Wallet,
  'id' | 'uuid' | 'name' | 'state' | 'default' | 'createdAt'
> & { userId: UserId; userName: UserName };

class GetAllUserWalletByUserWalletResponse
  extends AutoValidator
  implements TGetAllUserWalletByUserWalletResponse
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

  constructor(props: TGetAllUserWalletByUserWalletResponse) {
    super(props);
  }
}

type TGetAllUserWalletByUserResponse = Pick<UserWallet, 'id'> & {
  userId: UserId;
  permissionTypeTags: PermissionTypeTag[];
  wallet: TGetAllUserWalletByUserWalletResponse;
};

export class GetAllUserWalletByUserResponse
  extends AutoValidator
  implements TGetAllUserWalletByUserResponse
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  @ValidateNested()
  wallet: GetAllUserWalletByUserWalletResponse;

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  constructor(props: TGetAllUserWalletByUserResponse) {
    super(props);
  }
}

export class GetAllUserWalletByUserController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
    userWalletRepository: UserWalletRepository,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetAllUserWalletByUserController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletRepository,
      userWalletRepository,
      userService,
    );
  }

  async execute(
    request: GetAllUserWalletByUserRequest,
  ): Promise<GetAllUserWalletByUserResponse[]> {
    this.logger.debug('Get all UserWallet by user request.', { request });

    const { userId, owner } = request;

    const filters = owner && { owner };
    const user = new UserEntity({ uuid: userId });

    const results = await this.usecase.execute(user, filters);

    const response = results.map(
      (item) =>
        new GetAllUserWalletByUserResponse({
          id: item.id,
          userId: item.user.uuid,
          permissionTypeTags: item.permissionTypes.map(({ tag }) => tag),
          wallet: new GetAllUserWalletByUserWalletResponse({
            id: item.wallet.id,
            name: item.wallet.name,
            uuid: item.wallet.uuid,
            state: item.wallet.state,
            default: item.wallet.default,
            userId: item.wallet.user.uuid,
            userName: item.wallet.user.name,
            createdAt: item.wallet.createdAt,
          }),
        }),
    );

    this.logger.debug('Get all UserWallet by user response.', { response });

    return response;
  }
}
