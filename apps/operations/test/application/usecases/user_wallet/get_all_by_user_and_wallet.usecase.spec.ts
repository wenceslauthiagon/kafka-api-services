import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { UserWalletEntity, UserWalletRepository } from '@zro/operations/domain';
import {
  GetAllUserWalletByUserAndWalletUseCase as UseCase,
  UserService,
} from '@zro/operations/application';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('GetAllUserWalletByUserAndWalletUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const userWalletRepository: UserWalletRepository =
      createMock<UserWalletRepository>();
    const mockGetUserWalletByUserAndWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.getByUserAndWallet));
    const mockGetUserWalletdWalletRepository: jest.Mock = On(
      userWalletRepository,
    ).get(method((mock) => mock.getAllByWallet));

    return {
      userWalletRepository,
      mockGetUserWalletByUserAndWalletRepository,
      mockGetUserWalletdWalletRepository,
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
      mockGetUserWalletdWalletRepository,
    } = mockRepository();

    const { userService, mockGetUserByUuidService } = mockService();

    const sut = new UseCase(logger, userWalletRepository, userService);
    return {
      sut,
      mockGetUserWalletByUserAndWalletRepository,
      mockGetUserWalletdWalletRepository,
      mockGetUserByUuidService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get user wallet permissions if missing data', async () => {
      const {
        sut,
        mockGetUserWalletByUserAndWalletRepository,
        mockGetUserWalletdWalletRepository,
        mockGetUserByUuidService,
      } = makeSut();

      await expect(() => sut.execute(null, null)).rejects.toThrow(
        MissingDataException,
      );

      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetUserWalletdWalletRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get user wallet permissions successfully ', async () => {
      const {
        sut,
        mockGetUserWalletByUserAndWalletRepository,
        mockGetUserWalletdWalletRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const userWallet = await UserWalletFactory.create<UserWalletEntity>(
        UserWalletEntity.name,
      );

      const { wallet, user } = userWallet;

      mockGetUserWalletByUserAndWalletRepository.mockResolvedValue(userWallet);
      mockGetUserWalletdWalletRepository.mockResolvedValue([userWallet]);
      mockGetUserByUuidService.mockResolvedValue({
        uuid: user.uuid,
        name: user.name,
      });

      const result = await sut.execute(user, wallet);

      expect(result).toBeDefined();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(userWallet.id);
      expect(result[0].user).toMatchObject(userWallet.user);
      expect(result[0].permissionTypes).toBe(userWallet.permissionTypes);
      expect(mockGetUserWalletByUserAndWalletRepository).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetUserWalletByUserAndWalletRepository).toBeCalledWith(
        user,
        wallet,
      );
      expect(mockGetUserWalletdWalletRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserWalletdWalletRepository).toHaveBeenCalledWith(wallet);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledWith({
        userId: user.uuid,
      });
    });
  });
});
