import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { PermissionTypeEntity, WalletEntity } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  UserWalletEntity,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  UpdateUserWalletByWalletUseCase as UseCase,
  UserService,
  UserWalletAlreadyExistsException,
  UserWalletNotFoundException,
  WalletNotFoundException,
} from '@zro/operations/application';
import { UserFactory } from '@zro/test/users/config';
import {
  PermissionTypeFactory,
  UserWalletFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('UpdateUserWalletByWalletUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetUserWalletByWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.getByUserAndWallet));
    const mockUpdateUserWalletByWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.update));

    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      userWalletRepository,
      mockGetUserWalletByWalletRepository,
      mockUpdateUserWalletByWalletRepository,
      walletRepository,
      mockGetWalletByUuidRepository,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );

    return {
      userService,
      mockGetUserByUuidService,
    };
  };

  const makeSut = () => {
    const {
      userWalletRepository,
      mockGetUserWalletByWalletRepository,
      mockUpdateUserWalletByWalletRepository,
      walletRepository,
      mockGetWalletByUuidRepository,
    } = mockRepository();

    const ROOT = 'ROOT';
    const ADMIN = 'ADMIN';

    const { userService, mockGetUserByUuidService } = mockService();

    const sut = new UseCase(
      logger,
      walletRepository,
      userWalletRepository,
      userService,
      ROOT,
    );

    return {
      sut,
      mockGetUserWalletByWalletRepository,
      mockUpdateUserWalletByWalletRepository,
      mockGetWalletByUuidRepository,
      mockGetUserByUuidService,
      ROOT,
      ADMIN,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not update user wallet if missing data', async () => {
      const {
        sut,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const permissionTypes = [
        await PermissionTypeFactory.create<PermissionTypeEntity>(
          PermissionTypeEntity.name,
        ),
      ];
      const owner = await UserFactory.create<UserEntity>(UserEntity.name);
      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const tests = [
        () => sut.execute(null, null, null, null),
        () => sut.execute(owner, null, null, null),
        () => sut.execute(null, user, null, null),
        () => sut.execute(null, null, wallet, null),
        () => sut.execute(null, null, null, permissionTypes),
        () => sut.execute(owner, user, null, null),
        () => sut.execute(null, user, wallet, null),
        () => sut.execute(owner, null, wallet, null),
        () => sut.execute(owner, user, new WalletEntity({}), permissionTypes),
        () => sut.execute(owner, new UserEntity({}), wallet, permissionTypes),
        () => sut.execute(new UserEntity({}), user, wallet, permissionTypes),
        () => sut.execute(owner, user, wallet, []),
        () => sut.execute(owner, user, wallet, []),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not update if wallet not found', async () => {
      const {
        sut,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const { wallet, user, permissionTypes } =
        await UserWalletFactory.create<UserWalletEntity>(UserWalletEntity.name);

      mockGetWalletByUuidRepository.mockResolvedValue(null);

      const testScript = () => sut.execute(user, user, wallet, permissionTypes);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not update if wallet owner is not the same owner', async () => {
      const {
        sut,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const { wallet, user, permissionTypes } =
        await UserWalletFactory.create<UserWalletEntity>(UserWalletEntity.name);

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () => sut.execute(user, user, wallet, permissionTypes);

      await expect(testScript).rejects.toThrow(WalletNotFoundException);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not update if wallet owner is the user', async () => {
      const {
        sut,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const { wallet, user, permissionTypes } =
        await UserWalletFactory.create<UserWalletEntity>(UserWalletEntity.name);
      wallet.user = user;

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);

      const testScript = () => sut.execute(user, user, wallet, permissionTypes);

      await expect(testScript).rejects.toThrow(
        UserWalletAlreadyExistsException,
      );
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not update if user wallet not found', async () => {
      const {
        sut,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const { wallet, user, permissionTypes } =
        await UserWalletFactory.create<UserWalletEntity>(UserWalletEntity.name);

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserWalletByWalletRepository.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(wallet.user, user, wallet, permissionTypes);

      await expect(testScript).rejects.toThrow(UserWalletNotFoundException);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not update if user wallet has no user data', async () => {
      const {
        sut,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );
      const { wallet, user, permissionTypes } = userWallet;

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserWalletByWalletRepository.mockResolvedValue(userWallet);
      mockGetUserByUuidService.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(wallet.user, user, wallet, permissionTypes);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: user.uuid,
      });
    });

    it('TC0007 - Should not update if user wallet has root permission', async () => {
      const {
        sut,
        ROOT,
        ADMIN,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const permissionTypeRoot = [new PermissionTypeEntity({ tag: ROOT })];
      const permissionTypeAdmin = [new PermissionTypeEntity({ tag: ADMIN })];
      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
        { permissionTypes: permissionTypeRoot },
      );
      const { wallet, user } = userWallet;

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserWalletByWalletRepository.mockResolvedValue(userWallet);
      mockGetUserByUuidService.mockResolvedValue(user);

      const result = await sut.execute(
        wallet.user,
        user,
        wallet,
        permissionTypeAdmin,
      );

      expect(result).toBeDefined();
      expect(result.user).toBe(userWallet.user);
      expect(result.wallet).toBe(userWallet.wallet);
      expect(result.permissionTypes).toBe(userWallet.permissionTypes);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: user.uuid,
      });
    });
  });

  describe('With valid parameters', () => {
    it('TC0008 - Should update user wallet successfully ', async () => {
      const {
        sut,
        ADMIN,
        mockGetUserWalletByWalletRepository,
        mockUpdateUserWalletByWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );
      const { wallet, user } = userWallet;
      const permissionTypeAdmin = [new PermissionTypeEntity({ tag: ADMIN })];

      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserWalletByWalletRepository.mockResolvedValue(userWallet);
      mockGetUserByUuidService.mockResolvedValue(user);
      mockUpdateUserWalletByWalletRepository.mockImplementation((i) => i);

      const result = await sut.execute(
        wallet.user,
        user,
        wallet,
        permissionTypeAdmin,
      );

      expect(result).toBeDefined();
      expect(result.user).toBe(userWallet.user);
      expect(result.wallet).toBe(userWallet.wallet);
      expect(result.permissionTypes).toBe(permissionTypeAdmin);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByWalletRepository).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockUpdateUserWalletByWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: user.uuid,
      });
    });
  });
});
