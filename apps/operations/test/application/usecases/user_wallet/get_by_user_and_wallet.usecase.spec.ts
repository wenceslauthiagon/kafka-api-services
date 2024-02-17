import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { WalletEntity } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  UserWalletEntity,
  UserWalletRepository,
  WalletRepository,
} from '@zro/operations/domain';
import {
  GetUserWalletByUserAndWalletUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import { UserFactory } from '@zro/test/users/config';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('GetUserWalletByUserAndWalletUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetUserWalletByUserAndWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.getByUserAndWallet));

    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletByUuidRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      userWalletRepository,
      mockGetUserWalletByUserAndWalletRepository,
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
      mockGetUserWalletByUserAndWalletRepository,
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
      mockGetUserWalletByUserAndWalletRepository,
      mockGetWalletByUuidRepository,
      mockGetUserByUuidService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get user wallet if missing data', async () => {
      const {
        sut,
        mockGetUserWalletByUserAndWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const tests = [
        () =>
          sut.execute(new UserEntity({ uuid: faker.datatype.uuid() }), null),
        () =>
          sut.execute(null, new WalletEntity({ uuid: faker.datatype.uuid() })),
        () =>
          sut.execute(
            new UserEntity({}),
            new WalletEntity({ uuid: faker.datatype.uuid() }),
          ),
        () => sut.execute(null, null),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not get if user wallet not found', async () => {
      const {
        sut,
        mockGetUserWalletByUserAndWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const { wallet } = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      mockGetUserWalletByUserAndWalletRepository.mockResolvedValue(null);

      const result = await sut.execute(user, wallet);

      expect(result).toBeNull();
      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should get user wallet successfully ', async () => {
      const {
        sut,
        mockGetUserWalletByUserAndWalletRepository,
        mockGetWalletByUuidRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet } = userWallet;
      const { user: walletUser } = wallet;

      mockGetUserWalletByUserAndWalletRepository.mockResolvedValue(userWallet);
      mockGetWalletByUuidRepository.mockResolvedValue(wallet);
      mockGetUserByUuidService.mockResolvedValue({
        uuid: walletUser.uuid,
        name: walletUser.name,
      });

      const result = await sut.execute(user, wallet);

      expect(result).toBeDefined();
      expect(result.user).toBe(userWallet.user);
      expect(result.wallet).toBe(userWallet.wallet);
      expect(result.permissionTypes).toBe(userWallet.permissionTypes);
      expect(result.wallet.user.uuid).toBe(walletUser.uuid);
      expect(result.wallet.user.name).toBe(walletUser.name);
      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledWith(
        user,
        wallet,
      );
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletByUuidRepository).toHaveBeenCalledWith(wallet.uuid);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: walletUser.uuid,
      });
    });
  });
});
