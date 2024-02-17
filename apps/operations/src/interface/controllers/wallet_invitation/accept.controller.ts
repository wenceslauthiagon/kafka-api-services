import { Logger } from 'winston';
import { IsEmail, IsEnum, IsString, IsUUID, Length } from 'class-validator';
import { AutoValidator, IsIsoStringDateFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  PermissionType,
  UserWalletRepository,
  Wallet,
  WalletInvitation,
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import { AcceptWalletInvitationUseCase as UseCase } from '@zro/operations/application';

type PermissionTypeTag = PermissionType['tag'];
type WalletId = Wallet['uuid'];
type UserId = User['uuid'];

type TAcceptWalletInvitationRequest = Pick<
  WalletInvitation,
  'id' | 'confirmCode' | 'email'
> & { userId: UserId };

export class AcceptWalletInvitationRequest
  extends AutoValidator
  implements TAcceptWalletInvitationRequest
{
  @IsUUID(4)
  id: string;

  @IsString()
  @Length(1, 255)
  confirmCode: string;

  @IsUUID(4)
  userId: string;

  @IsEmail()
  email: string;

  constructor(props: TAcceptWalletInvitationRequest) {
    super(props);
  }
}

type TAcceptWalletInvitationResponse = Pick<
  WalletInvitation,
  'id' | 'email' | 'state' | 'createdAt' | 'expiredAt'
> & { permissionTypeTags: PermissionTypeTag[]; walletId: WalletId };

export class AcceptWalletInvitationResponse
  extends AutoValidator
  implements TAcceptWalletInvitationResponse
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

  constructor(props: TAcceptWalletInvitationResponse) {
    super(props);
  }
}

export class AcceptWalletInvitationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    walletInvitationRepository: WalletInvitationRepository,
    userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({
      context: AcceptWalletInvitationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      walletInvitationRepository,
      userWalletRepository,
    );
  }

  /**
   * Accept Wallet invitation.
   *
   * @param request Input data.
   * @returns WalletInvitation if found or null otherwise.
   */
  async execute(
    request: AcceptWalletInvitationRequest,
  ): Promise<AcceptWalletInvitationResponse> {
    this.logger.debug('Accept wallet invitation request.', { request });

    const { id, confirmCode, userId, email } = request;

    const user = new UserEntity({ uuid: userId, email });

    const result = await this.usecase.execute(id, confirmCode, user);

    const response = new AcceptWalletInvitationResponse({
      id: result.id,
      email: result.email,
      state: result.state,
      walletId: result.wallet.uuid,
      permissionTypeTags: result.permissionTypes.map(({ tag }) => tag),
      createdAt: result.createdAt,
      expiredAt: result.expiredAt,
    });

    this.logger.debug('Accept wallet invitation response.', { response });

    return response;
  }
}
