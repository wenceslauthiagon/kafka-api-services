import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserWalletEntity,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  GetAllUserWalletByUserUseCase as UseCase,
  UserService,
  OwnerType,
} from '@zro/operations/application';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('GetAllUserWalletByUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetUserWalletByUserRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.getAllByUser));

    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      userWalletRepository,
      mockGetUserWalletByUserRepository,
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
      mockGetUserWalletByUserRepository,
      walletRepository,
      mockGetWalletByUuidRepository,
    } = mockRepository();

    const { userService, mockGetUserByUuidService } = mockService();

    const sut = new UseCase(
      logger,
      walletRepository,
      userWalletRepository,
      userService,
    );
    return {
      sut,
      mockGetUserWalletByUserRepository,
      mockGetWalletByUuidRepository,
      mockGetUserByUuidService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get user wallet if missing data', async () => {
      const {
        sut,
        mockGetUserWalletByUserRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      await expect(() => sut.execute(null)).rejects.toThrow(
        MissingDataException,
      );

      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get user wallets without user', async () => {
      const {
        sut,
        mockGetUserWalletByUserRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      mockGetUserWalletByUserRepository.mockResolvedValue([userWallet]);
      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserByUuidService.mockResolvedValue(null);

      await expect(() => sut.execute(user)).rejects.toThrow(
        UserNotFoundException,
      );

      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledWith(user);
      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: wallet.user.uuid,
      });
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should get user wallets successfully', async () => {
      const {
        sut,
        mockGetUserWalletByUserRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      mockGetUserWalletByUserRepository.mockResolvedValue([userWallet]);
      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserByUuidService.mockResolvedValue({
        uuid: wallet.user.uuid,
        name: wallet.user.name,
      });

      const result = await sut.execute(user);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(userWallet.id);
      expect(result[0].user).toMatchObject(userWallet.user);
      expect(result[0].permissionTypes).toBe(userWallet.permissionTypes);
      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledWith(user);
      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: wallet.user.uuid,
      });
    });

    it('TC0004 - Should get user wallets that user is owner successfully', async () => {
      const {
        sut,
        mockGetUserWalletByUserRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      mockGetUserWalletByUserRepository.mockResolvedValue([userWallet]);
      mockGetWalletByUuidRepository.mockResolvedValue(userWallet.wallet);
      mockGetUserByUuidService.mockResolvedValue({
        uuid: userWallet.wallet.user.uuid,
        name: userWallet.wallet.user.name,
      });

      const result = await sut.execute(userWallet.wallet.user, {
        owner: OwnerType.USER,
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(userWallet.id);
      expect(result[0].user).toMatchObject(userWallet.user);
      expect(result[0].permissionTypes).toBe(userWallet.permissionTypes);
      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(
        userWallet.wallet.uuid,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: userWallet.wallet.user.uuid,
      });
    });

    it('TC0005 - Should get user wallets that user not id owner successfully', async () => {
      const {
        sut,
        mockGetUserWalletByUserRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      mockGetUserWalletByUserRepository.mockResolvedValue([userWallet]);
      mockGetWalletByUuidRepository.mockResolvedValue(userWallet.wallet);
      mockGetUserByUuidService.mockResolvedValue({
        uuid: userWallet.wallet.user.uuid,
        name: userWallet.wallet.user.name,
      });

      const result = await sut.execute(userWallet.user, {
        owner: OwnerType.OTHER,
      });

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(userWallet.id);
      expect(result[0].user).toMatchObject(userWallet.user);
      expect(result[0].permissionTypes).toBe(userWallet.permissionTypes);
      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletByUserRepository).toHaveBeenCalledWith(
        userWallet.user,
      );
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(
        userWallet.wallet.uuid,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: userWallet.wallet.user.uuid,
      });
    });
  });
});
