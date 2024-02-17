import { Logger } from 'winston';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  WalletEntity,
  UserWalletRepository,
  PermissionType,
  WalletRepository,
  PermissionTypeEntity,
} from '@zro/operations/domain';
import {
  UpdateUserWalletByWalletUseCase as UseCase,
  UserService,
} from '@zro/operations/application';

type UserId = User['uuid'];
type UserName = User['name'];
type WalletId = Wallet['uuid'];
type PermissionTypeTag = PermissionType['tag'];

type TUpdateUserWalletByWalletRequest = {
  ownerWalletId: UserId;
  userId: UserId;
  walletId: WalletId;
  permissionTypeTags: PermissionTypeTag[];
};

export class UpdateUserWalletByWalletRequest
  extends AutoValidator
  implements TUpdateUserWalletByWalletRequest
{
  @IsUUID(4)
  ownerWalletId: UserId;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  @ArrayUnique()
  @ArrayMaxSize(16)
  @ArrayMinSize(1)
  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  constructor(props: TUpdateUserWalletByWalletRequest) {
    super(props);
  }
}

type TUpdateUserWalletByWalletResponse = {
  id: UserId;
  name: UserName;
  permissionTypeTags: PermissionTypeTag[];
};

export class UpdateUserWalletByWalletResponse
  extends AutoValidator
  implements TUpdateUserWalletByWalletResponse
{
  @IsUUID(4)
  id: UserId;

  @IsString()
  @MaxLength(255)
  name: UserName;

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  constructor(props: TUpdateUserWalletByWalletResponse) {
    super(props);
  }
}

export class UpdateUserWalletByWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletRepository: WalletRepository,
    userWalletRepository: UserWalletRepository,
    userService: UserService,
    permissionRootTag: string,
  ) {
    this.logger = logger.child({
      context: UpdateUserWalletByWalletController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletRepository,
      userWalletRepository,
      userService,
      permissionRootTag,
    );
  }

  async execute(
    request: UpdateUserWalletByWalletRequest,
  ): Promise<UpdateUserWalletByWalletResponse> {
    this.logger.debug('Update by wallet id request.', { request });

    const { ownerWalletId, userId, walletId, permissionTypeTags } = request;

    const ownerWallet = new UserEntity({ uuid: ownerWalletId });
    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId });
    const permissionTypes = permissionTypeTags.map(
      (tag) => new PermissionTypeEntity({ tag }),
    );

    const result = await this.usecase.execute(
      ownerWallet,
      user,
      wallet,
      permissionTypes,
    );

    const response = new UpdateUserWalletByWalletResponse({
      id: result.user.uuid,
      name: result.user.name,
      permissionTypeTags: result.permissionTypes.map(({ tag }) => tag),
    });

    this.logger.debug('Update by wallet id response.', { response });

    return response;
  }
}
