import { Logger } from 'winston';
import { IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  PermissionType,
  Wallet,
  WalletInvitation,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { CancelWalletInvitationUseCase as UseCase } from '@zro/operations/application';

type PermissionTypeTag = PermissionType['tag'];
type WalletId = Wallet['uuid'];
type UserId = User['uuid'];

type TCancelWalletInvitationRequest = Pick<WalletInvitation, 'id'> & {
  userId: UserId;
};

export class CancelWalletInvitationRequest
  extends AutoValidator
  implements TCancelWalletInvitationRequest
{
  @IsUUID(4)
  id: string;

  @IsUUID(4)
  userId: UserId;

  constructor(props: TCancelWalletInvitationRequest) {
    super(props);
  }
}

type TCancelWalletInvitationResponse = Pick<
  WalletInvitation,
  'id' | 'email' | 'state' | 'createdAt' | 'expiredAt'
> & { permissionTypeTags: PermissionTypeTag[]; walletId: WalletId };

export class CancelWalletInvitationResponse
  extends AutoValidator
  implements TCancelWalletInvitationResponse
{
  @IsUUID(4)
  id: string;

  @IsEmail()
  email: string;

  @IsEnum(WalletInvitationState)
  state: WalletInvitationState;

  @IsUUID(4)
  walletId: WalletId;

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

  constructor(props: TCancelWalletInvitationResponse) {
    super(props);
  }
}

export class CancelWalletInvitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: CancelWalletInvitationController.name,
    });

    this.usecase = new UseCase(this.logger, walletInvitationRepository);
  }

  /**
   * Cancel Wallet invitation.
   *
   * @param request Input data.
   * @returns WalletInvitation if found or null otherwise.
   */
  async execute(
    request: CancelWalletInvitationRequest,
  ): Promise<CancelWalletInvitationResponse> {
    this.logger.debug('Cancel wallet invitation request.', { request });

    const { id, userId } = request;

    const user = new UserEntity({ uuid: userId });

    const result = await this.usecase.execute(id, user);

    const response = new CancelWalletInvitationResponse({
      id: result.id,
      email: result.email,
      state: result.state,
      walletId: result.wallet.uuid,
      permissionTypeTags: result.permissionTypes.map(({ tag }) => tag),
      createdAt: result.createdAt,
      expiredAt: result.expiredAt,
    });

    this.logger.debug('Cancel wallet invitation response.', { response });

    return response;
  }
}
