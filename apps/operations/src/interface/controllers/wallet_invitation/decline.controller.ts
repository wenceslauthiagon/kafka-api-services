import { Logger } from 'winston';
import { IsEmail, IsEnum, IsString, IsUUID } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  PermissionType,
  Wallet,
  WalletInvitation,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { DeclineWalletInvitationUseCase as UseCase } from '@zro/operations/application';

type WalletId = Wallet['uuid'];
type PermissionTypeTag = PermissionType['tag'];

type TDeclineWalletInvitationRequest = Pick<WalletInvitation, 'id' | 'email'>;

export class DeclineWalletInvitationRequest
  extends AutoValidator
  implements TDeclineWalletInvitationRequest
{
  @IsUUID(4)
  id: string;

  @IsEmail()
  email: string;

  constructor(props: TDeclineWalletInvitationRequest) {
    super(props);
  }
}

type TDeclineWalletInvitationResponse = Pick<
  WalletInvitation,
  'id' | 'email' | 'state' | 'createdAt' | 'expiredAt'
> & { permissionTypeTags: PermissionTypeTag[]; walletId: WalletId };

export class DeclineWalletInvitationResponse
  extends AutoValidator
  implements TDeclineWalletInvitationResponse
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

  constructor(props: TDeclineWalletInvitationResponse) {
    super(props);
  }
}

export class DeclineWalletInvitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
  ) {
    this.logger = logger.child({
      context: DeclineWalletInvitationController.name,
    });

    this.usecase = new UseCase(this.logger, walletInvitationRepository);
  }

  /**
   * Decline Wallet invitation.
   *
   * @param request Input data.
   * @returns WalletInvitation if found or null otherwise.
   */
  async execute(
    request: DeclineWalletInvitationRequest,
  ): Promise<DeclineWalletInvitationResponse> {
    this.logger.debug('Decline wallet invitation request.', { request });

    const { id, email } = request;

    const user = new UserEntity({ email });

    const result = await this.usecase.execute(id, user);

    const response = new DeclineWalletInvitationResponse({
      id: result.id,
      email: result.email,
      state: result.state,
      walletId: result.wallet.uuid,
      permissionTypeTags: result.permissionTypes.map(({ tag }) => tag),
      createdAt: result.createdAt,
      expiredAt: result.expiredAt,
    });

    this.logger.debug('Decline wallet invitation response.', { response });

    return response;
  }
}
