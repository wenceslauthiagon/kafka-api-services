import { Logger } from 'winston';
import {
  IsArray,
  IsInt,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  UserWalletRepository,
  WalletEntity,
  PermissionType,
} from '@zro/operations/domain';
import {
  GetAllUserWalletByUserAndWalletUseCase as UseCase,
  UserService,
} from '@zro/operations/application';

type UserId = User['uuid'];
type UserName = User['name'];
type WalletId = Wallet['uuid'];
type PermissionTypeTag = PermissionType['tag'];

type TGetUserWalletPermissionsByUserAndWalletRequest = {
  userId: UserId;
  walletId: WalletId;
};

export class GetAllUserWalletByUserAndWalletRequest
  extends AutoValidator
  implements TGetUserWalletPermissionsByUserAndWalletRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: GetAllUserWalletByUserAndWalletRequest) {
    super(props);
  }
}

type TGetUserWalletPermissionsByUserAndWalletWalletResponseItem = {
  id: UserId;
  name: UserName;
  permissionTypeTags: PermissionTypeTag[];
};

export class GetAllUserWalletByUserAndWalletResponseItem
  extends AutoValidator
  implements TGetUserWalletPermissionsByUserAndWalletWalletResponseItem
{
  @IsUUID(4)
  id: UserId;

  @IsString()
  @MaxLength(255)
  name: UserName;

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  constructor(
    props: TGetUserWalletPermissionsByUserAndWalletWalletResponseItem,
  ) {
    super(props);
  }
}

type TGetUserWalletPermissionsByUserAndWalletResponse = {
  total: number;
  data: TGetUserWalletPermissionsByUserAndWalletWalletResponseItem[];
};

export class GetAllUserWalletByUserAndWalletResponse
  extends AutoValidator
  implements TGetUserWalletPermissionsByUserAndWalletResponse
{
  @IsInt()
  @Min(0)
  total: number;

  @IsArray()
  data: GetAllUserWalletByUserAndWalletResponseItem[];

  constructor(props: TGetUserWalletPermissionsByUserAndWalletResponse) {
    super(props);
  }
}

export class GetAllUserWalletByUserAndWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userWalletRepository: UserWalletRepository,
    userService: UserService,
  ) {
    this.logger = logger.child({
      context: GetAllUserWalletByUserAndWalletController.name,
    });

    this.usecase = new UseCase(this.logger, userWalletRepository, userService);
  }

  async execute(
    request: GetAllUserWalletByUserAndWalletRequest,
  ): Promise<GetAllUserWalletByUserAndWalletResponse> {
    this.logger.debug('Get UserWallet by user request.', { request });

    const { userId, walletId } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });

    const results = await this.usecase.execute(user, wallet);

    const users = results.map(
      (item) =>
        new GetAllUserWalletByUserAndWalletResponseItem({
          id: item.user.uuid,
          name: item.user.name,
          permissionTypeTags: item.permissionTypes.map(({ tag }) => tag),
        }),
    );

    const response = new GetAllUserWalletByUserAndWalletResponse({
      total: results.length,
      data: users,
    });

    this.logger.debug('Get UserWallet by user response.', { response });

    return response;
  }
}
