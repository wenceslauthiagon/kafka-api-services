import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  UserWalletRepository,
  WalletAccountCacheRepository,
  WalletAccountEntity,
  WalletAccountRepository,
  WalletAccountState,
  WalletEntity,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CreateP2PTransferUseCase,
  DeleteWalletByUuidAndUserUseCase as UseCase,
  WalletAccountHasBalanceException,
  WalletCannotBeDeletedException,
  WalletNotActiveException,
  WalletNotFoundException,
} from '@zro/operations/application';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('DeleteWalletByUuidAndUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockUseCase = () => {
    const createP2PTransferUseCase = createMock<CreateP2PTransferUseCase>();

    const mockCreateP2PTransferExecute: jest.Mock = On(
      createP2PTransferUseCase,
    ).get(method((mock) => mock.execute));

    return {
      createP2PTransferUseCase,
      mockCreateP2PTransferExecute,
    };
  };

  const makeSut = () => {
    const {
      walletRepository,
      walletAccountRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      mockGetWalletByUuidRepository,
      mockUpdateWalletRepository,
      mockGetAllWalletAccountCacheRepository,
      mockUpdateWalletAccountRepository,
      mockDeleteUserWalletRepository,
    } = mockRepository();

    const { createP2PTransferUseCase, mockCreateP2PTransferExecute } =
      mockUseCase();

    const sut = new UseCase(
      logger,
      walletRepository,
      walletAccountRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      createP2PTransferUseCase,
    );

    return {
      sut,
      mockGetWalletByUuidRepository,
      mockUpdateWalletRepository,
      mockGetAllWalletAccountCacheRepository,
      mockUpdateWalletAccountRepository,
      mockDeleteUserWalletRepository,
      mockCreateP2PTransferExecute,
    };
  };

  const mockRepository = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );
    const mockUpdateWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.update),
    );

    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const mockUpdateWalletAccountRepository: jest.Mock = On(
      walletAccountRepository,
    ).get(method((mock) => mock.update));

    const walletAccountCacheRepository: WalletAccountCacheRepository =
      createMock<WalletAccountCacheRepository>();
    const mockGetAllWalletAccountCacheRepository: jest.Mock = On(
      walletAccountCacheRepository,
    ).get(method((mock) => mock.getAllByWallet));

    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockDeleteUserWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.deleteByWallet));

    return {
      walletRepository,
      walletAccountRepository,
      walletAccountCacheRepository,
      userWalletRepository,
      mockGetWalletByUuidRepository,
      mockUpdateWalletRepository,
      mockGetAllWalletAccountCacheRepository,
      mockUpdateWalletAccountRepository,
      mockDeleteUserWalletRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not delete wallet if missing params', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(uuidV4(), null),
        () => sut.execute(null, user),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not delete if wallet not found', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetWalletByUuidRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(uuidV4(), user);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not delete if other user has the wallet found', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () => sut.execute(wallet.uuid, user);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not delete if wallet is deactivate', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: true, state: WalletState.DEACTIVATE },
      );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const result = await sut.execute(wallet.uuid, wallet.user);

      expect(result).toBeUndefined();
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not delete if wallet is default', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: true, state: WalletState.ACTIVE },
      );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () => sut.execute(wallet.uuid, wallet.user);

      await expect(testScript).rejects.toThrow(WalletCannotBeDeletedException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not delete if wallet has WalletAccount with non-zero balance and not has wallet backup', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const walletAccount1 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 1000, state: WalletAccountState.ACTIVE },
        );
      const walletAccount2 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 0, state: WalletAccountState.ACTIVE },
        );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetAllWalletAccountCacheRepository.mockResolvedValue([
        walletAccount1,
        walletAccount2,
      ]);

      const testScript = () => sut.execute(wallet.uuid, wallet.user);

      await expect(testScript).rejects.toThrow(
        WalletAccountHasBalanceException,
      );

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not delete if wallet has WalletAccount with non-zero balance and wallet backup not found', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const walletBackup = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const walletAccount1 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 1000, state: WalletAccountState.ACTIVE },
        );
      const walletAccount2 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 0, state: WalletAccountState.ACTIVE },
        );

      mockGetWalletByUuidRepository.mockResolvedValueOnce(wallet);
      mockGetAllWalletAccountCacheRepository.mockResolvedValue([
        walletAccount1,
        walletAccount2,
      ]);
      mockGetWalletByUuidRepository.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(wallet.uuid, wallet.user, walletBackup);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not delete if wallet has WalletAccount with non-zero balance and wallet backup is from another user', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const walletAccount1 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 1000, state: WalletAccountState.ACTIVE },
        );
      const walletAccount2 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 0, state: WalletAccountState.ACTIVE },
        );

      const walletBackup = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );

      mockGetWalletByUuidRepository.mockResolvedValueOnce(wallet);
      mockGetAllWalletAccountCacheRepository.mockResolvedValue([
        walletAccount1,
        walletAccount2,
      ]);
      mockGetWalletByUuidRepository.mockResolvedValueOnce(walletBackup);

      const testScript = () =>
        sut.execute(wallet.uuid, wallet.user, walletBackup);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not delete if wallet has WalletAccount with non-zero balance and wallet backup not is active', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const walletAccount1 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 1000, state: WalletAccountState.ACTIVE },
        );
      const walletAccount2 =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 0, state: WalletAccountState.ACTIVE },
        );

      const walletBackup = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.DEACTIVATE, user: wallet.user },
      );

      mockGetWalletByUuidRepository.mockResolvedValueOnce(wallet);
      mockGetAllWalletAccountCacheRepository.mockResolvedValue([
        walletAccount1,
        walletAccount2,
      ]);
      mockGetWalletByUuidRepository.mockResolvedValueOnce(walletBackup);

      const testScript = () =>
        sut.execute(wallet.uuid, wallet.user, walletBackup);

      await expect(testScript).rejects.toThrow(WalletNotActiveException);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0010 - Should delete wallet with valid params', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 0, state: WalletAccountState.ACTIVE },
        );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetAllWalletAccountCacheRepository.mockResolvedValue([walletAccount]);

      await sut.execute(wallet.uuid, wallet.user);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - Should not delete if it is a deactivate wallet', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.DEACTIVATE },
      );

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      await sut.execute(wallet.uuid, wallet.user);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should delete wallet with balance', async () => {
      const {
        sut,
        mockGetWalletByUuidRepository,
        mockUpdateWalletRepository,
        mockGetAllWalletAccountCacheRepository,
        mockUpdateWalletAccountRepository,
        mockDeleteUserWalletRepository,
        mockCreateP2PTransferExecute,
      } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE },
      );
      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { balance: 1000, state: WalletAccountState.ACTIVE },
        );

      const walletBackup = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { default: false, state: WalletState.ACTIVE, user: wallet.user },
      );

      mockGetWalletByUuidRepository.mockResolvedValueOnce(wallet);
      mockGetAllWalletAccountCacheRepository.mockResolvedValue([walletAccount]);
      mockGetWalletByUuidRepository.mockResolvedValueOnce(walletBackup);

      await sut.execute(wallet.uuid, wallet.user, walletBackup);

      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(2);
      expect(mockGetAllWalletAccountCacheRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletAccountRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockDeleteUserWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateP2PTransferExecute).toHaveBeenCalledTimes(1);
    });
  });
});
