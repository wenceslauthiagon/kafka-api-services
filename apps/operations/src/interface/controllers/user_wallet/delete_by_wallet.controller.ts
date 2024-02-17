import { Logger } from 'winston';
import { IsUUID } from 'class-validator';
import { AutoValidator } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  WalletEntity,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { DeleteUserWalletUseCase as UseCase } from '@zro/operations/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TDeleteUserWalletRequest = {
  ownerWalletId: UserId;
  userId: UserId;
  walletId: WalletId;
};

export class DeleteUserWalletRequest
  extends AutoValidator
  implements TDeleteUserWalletRequest
{
  @IsUUID(4)
  ownerWalletId: UserId;

  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: DeleteUserWalletRequest) {
    super(props);
  }
}

export class DeleteUserWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userWalletRepository: UserWalletRepository,
    walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({
      context: DeleteUserWalletController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userWalletRepository,
      walletRepository,
    );
  }

  async execute(request: DeleteUserWalletRequest): Promise<void> {
    this.logger.debug('Delete UserWallet by user and wallet request.', {
      request,
    });

    const { ownerWalletId, userId, walletId } = request;

    const ownerWallet = new UserEntity({ uuid: ownerWalletId });
    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId, user });

    await this.usecase.execute(ownerWallet, user, wallet);
  }
}
