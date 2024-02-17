import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserWithdrawSettingEntity,
  UserWithdrawSettingRepository,
  WithdrawSettingState,
} from '@zro/utils/domain';
import {
  DeleteUserWithdrawSettingUseCase as UseCase,
  UserWithdrawSettingInvalidStateException,
  UserWithdrawSettingNotFoundException,
} from '@zro/utils/application';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';

describe('DeleteUserWithdrawSettingUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const withdrawRepository: UserWithdrawSettingRepository =
      createMock<UserWithdrawSettingRepository>();
    const mockDelete: jest.Mock = On(withdrawRepository).get(
      method((mock) => mock.update),
    );
    const mockGetById: jest.Mock = On(withdrawRepository).get(
      method((mock) => mock.getById),
    );

    return {
      withdrawRepository,
      mockDelete,
      mockGetById,
    };
  };

  const makeSut = () => {
    const { withdrawRepository, mockDelete, mockGetById } = mockRepository();

    const sut = new UseCase(logger, withdrawRepository);

    return {
      sut,
      mockDelete,
      mockGetById,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const { sut, mockDelete } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should not delete if users withdraw setting not found', async () => {
      const { sut, mockGetById, mockDelete } = makeSut();

      mockGetById.mockResolvedValue(null);

      await expect(sut.execute('uuid')).rejects.toThrow(
        UserWithdrawSettingNotFoundException,
      );

      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not delete if user withdraw setting is DEACTIVE', async () => {
      const { sut, mockGetById, mockDelete } = makeSut();

      const withdraw =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
        );

      withdraw.state = WithdrawSettingState.DEACTIVE;
      mockGetById.mockResolvedValue(withdraw);

      await expect(sut.execute(withdraw.id)).rejects.toThrow(
        UserWithdrawSettingInvalidStateException,
      );

      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should delete successfully', async () => {
      const { sut, mockDelete, mockGetById } = makeSut();

      const userWithdrawSetting =
        await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
          UserWithdrawSettingEntity.name,
        );

      userWithdrawSetting.state = WithdrawSettingState.ACTIVE;

      mockGetById.mockResolvedValue(userWithdrawSetting);
      mockDelete.mockResolvedValue({});

      await sut.execute(userWithdrawSetting.id);

      expect(mockGetById).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });
});
