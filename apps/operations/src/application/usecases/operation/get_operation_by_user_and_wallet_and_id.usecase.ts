import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  Operation,
  OperationRepository,
  UserWalletRepository,
  Wallet,
  WalletAccountCacheRepository,
  WalletAccountEntity,
} from '@zro/operations/domain';
import { User } from '@zro/users/domain';
import {
  OperationNotFoundException,
  WalletAccountsNotFoundException,
} from '@zro/operations/application';

export class GetOperationByUserAndWalletAndIdUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param operationRepository Operation repository.
   * @param walletAccountCacheRepository WalletAccountCache repository.
   */
  constructor(
    private logger: Logger,
    private readonly operationRepository: OperationRepository,
    private readonly walletAccountCacheRepository: WalletAccountCacheRepository,
    private readonly userWalletRepository: UserWalletRepository,
  ) {
    this.logger = logger.child({
      context: GetOperationByUserAndWalletAndIdUseCase.name,
    });
  }

  /**
   * Get operation by wallet and user and id.
   * @param user User.
   * @param wallet Wallet.
   * @param id Operation id.
   * @returns Operation if found or null otherwise.
   */
  async execute(
    user: User,
    wallet: Wallet,
    id: Operation['id'],
  ): Promise<Operation> {
    // Data input check
    if (!user?.uuid || !wallet?.uuid || !id) {
      throw new MissingDataException([
        ...(!user?.uuid ? ['User'] : []),
        ...(!wallet?.uuid ? ['Wallet'] : []),
        ...(!id ? ['ID'] : []),
      ]);
    }

    const userWallet = await this.userWalletRepository.getByUserAndWallet(
      user,
      wallet,
    );

    this.logger.debug('UserWallet found.', { userWallet });

    if (!userWallet) {
      throw new OperationNotFoundException(id);
    }

    const walletAccounts =
      await this.walletAccountCacheRepository.getAllByWallet(wallet);

    this.logger.debug('Wallet accounts found.', { walletAccounts });

    if (!walletAccounts.length) {
      throw new WalletAccountsNotFoundException(wallet);
    }

    const operation = await this.operationRepository.getByWalletAccountsAndId(
      walletAccounts,
      id,
    );

    this.logger.debug('Operation found.', { operation });

    if (!operation) {
      throw new OperationNotFoundException(id);
    }

    const walletAccountMap = walletAccounts.reduce(
      (acc, att) => ({
        ...acc,
        [att.id]: new WalletAccountEntity({ uuid: att.uuid, wallet }),
      }),
      {},
    );

    operation.ownerWalletAccount =
      operation.ownerWalletAccount?.id &&
      walletAccountMap[operation.ownerWalletAccount.id];
    operation.beneficiaryWalletAccount =
      operation.beneficiaryWalletAccount?.id &&
      walletAccountMap[operation.beneficiaryWalletAccount.id];

    this.logger.debug('Operation response.', { operation });

    return operation;
  }
}
