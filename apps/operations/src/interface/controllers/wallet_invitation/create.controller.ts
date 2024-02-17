import { Logger } from 'winston';
import { IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  PermissionType,
  PermissionTypeEntity,
  Wallet,
  WalletEntity,
  WalletInvitation,
  WalletInvitationRepository,
  WalletInvitationState,
  WalletRepository,
} from '@zro/operations/domain';
import {
  CreateWalletInvitationUseCase as UseCase,
  NotificationService,
  UserService,
} from '@zro/operations/application';

type PermissionTypeTag = PermissionType['tag'];
type WalletId = Wallet['uuid'];
type UserId = User['uuid'];

type TCreateWalletInvitationRequest = Pick<WalletInvitation, 'id' | 'email'> & {
  walletId: WalletId;
  userId: UserId;
};

export class CreateWalletInvitationRequest
  extends AutoValidator
  implements TCreateWalletInvitationRequest
{
  @IsUUID(4)
  id: string;

  @IsEmail()
  email: string;

  @IsUUID(4)
  walletId: WalletId;

  @IsUUID(4)
  userId: UserId;

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  constructor(props: TCreateWalletInvitationRequest) {
    super(props);
  }
}

type TCreateWalletInvitationResponse = Pick<
  WalletInvitation,
  'id' | 'email' | 'state' | 'createdAt' | 'expiredAt'
> & { permissionTypeTags: PermissionTypeTag[]; walletId: WalletId };

export class CreateWalletInvitationResponse
  extends AutoValidator
  implements TCreateWalletInvitationResponse
{
  @IsUUID(4)
  id: string;

  @IsEmail()
  email: string;

  @IsEnum(WalletInvitationState)
  state: WalletInvitationState;

  @IsUUID(4)
  walletId: string;

  @IsString({ each: true })
  permissionTypeTags: PermissionTypeTag[];

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format createdAt',
  })
  createdAt: Date;

  @IsIsoStringDateFormat('YYYY-MM-DDTHH:mm:ss.SSSZ', {
    message: 'Invalid format expiredAt',
  })
  expiredAt: Date;

  constructor(props: TCreateWalletInvitationResponse) {
    super(props);
  }
}

export class CreateWalletInvitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
    walletRepository: WalletRepository,
    userService: UserService,
    notificationService: NotificationService,
    expiredInviteH: number,
    emailInviteTag: string,
    emailInviteUrl: string,
    emailInviteFrom: string,
    permissionRootTag: string,
  ) {
    this.logger = logger.child({
      context: CreateWalletInvitationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletInvitationRepository,
      walletRepository,
      userService,
      notificationService,
      expiredInviteH,
      emailInviteTag,
      emailInviteUrl,
      emailInviteFrom,
      permissionRootTag,
    );
  }

  /**
   * Create Wallet invitation.
   *
   * @param request Input data.
   * @returns WalletInvitation if found or null otherwise.
   */
  async execute(
    request: CreateWalletInvitationRequest,
  ): Promise<CreateWalletInvitationResponse> {
    this.logger.debug('Create wallet invitation request.', { request });

    const { id, email, walletId, userId, permissionTypeTags } = request;

    const wallet = new WalletEntity({ uuid: walletId });
    const user = new UserEntity({ uuid: userId });
    const permissionTypes = permissionTypeTags.map(
      (tag) => new PermissionTypeEntity({ tag }),
    );

    const result = await this.usecase.execute(
      id,
      email,
      wallet,
      user,
      permissionTypes,
    );

    const response = new CreateWalletInvitationResponse({
      id: result.id,
      email: result.email,
      state: result.state,
      walletId: result.wallet.uuid,
      permissionTypeTags: result.permissionTypes.map(({ tag }) => tag),
      createdAt: result.createdAt,
      expiredAt: result.expiredAt,
    });

    this.logger.debug('Create wallet invitation response.', { response });

    return response;
  }
}
