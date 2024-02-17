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
import { DeleteUserWalletByUserAndWalletUseCase as UseCase } from '@zro/operations/application';

type UserId = User['uuid'];
type WalletId = Wallet['uuid'];

type TDeleteUserWalletByUserAndWalletRequest = {
  userId: UserId;
  walletId: WalletId;
};

export class DeleteUserWalletByUserAndWalletRequest
  extends AutoValidator
  implements TDeleteUserWalletByUserAndWalletRequest
{
  @IsUUID(4)
  userId: UserId;

  @IsUUID(4)
  walletId: WalletId;

  constructor(props: DeleteUserWalletByUserAndWalletRequest) {
    super(props);
  }
}

export class DeleteUserWalletByUserAndWalletController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userWalletRepository: UserWalletRepository,
    walletRepository: WalletRepository,
  ) {
    this.logger = logger.child({
      context: DeleteUserWalletByUserAndWalletController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userWalletRepository,
      walletRepository,
    );
  }

  async execute(
    request: DeleteUserWalletByUserAndWalletRequest,
  ): Promise<void> {
    this.logger.debug('Delete UserWallet by user and wallet request.', {
      request,
    });

    const { userId, walletId } = request;

    const user = new UserEntity({ uuid: userId });
    const wallet = new WalletEntity({ uuid: walletId, user });

    await this.usecase.execute(user, wallet);
  }
}
