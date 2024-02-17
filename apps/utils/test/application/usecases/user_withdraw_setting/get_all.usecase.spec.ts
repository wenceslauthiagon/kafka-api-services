import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  PaginationEntity,
} from '@zro/common';
import { WalletEntity } from '@zro/operations/domain';
import { UserWithdrawSettingRepository } from '@zro/utils/domain';
import { GetAllUserWithdrawSettingUseCase as UseCase } from '@zro/utils/application';

describe('GetAllUserWithdrawSettingUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockRepository = () => {
    const withdrawRepository: UserWithdrawSettingRepository =
      createMock<UserWithdrawSettingRepository>();
    const mockGetAllByPaginationAndWallet: jest.Mock = On(
      withdrawRepository,
    ).get(method((mock) => mock.getAllByPaginationAndWallet));

    return {
      withdrawRepository,
      mockGetAllByPaginationAndWallet,
    };
  };

  const makeSut = () => {
    const { withdrawRepository, mockGetAllByPaginationAndWallet } =
      mockRepository();

    const sut = new UseCase(logger, withdrawRepository);

    return {
      sut,
      mockGetAllByPaginationAndWallet,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException if missing params.', async () => {
      const { sut, mockGetAllByPaginationAndWallet } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetAllByPaginationAndWallet).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get all withdrawals successfully.', async () => {
      const { sut, mockGetAllByPaginationAndWallet } = makeSut();

      const pagination = new PaginationEntity({});
      const wallet = new WalletEntity({});

      const test = await sut.execute(pagination, wallet);

      expect(test).toBeDefined();
      expect(mockGetAllByPaginationAndWallet).toHaveBeenCalledTimes(1);
    });
  });
});
