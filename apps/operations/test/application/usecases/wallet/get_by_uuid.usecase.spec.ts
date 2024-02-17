import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { WalletEntity, WalletRepository } from '@zro/operations/domain';
import { GetWalletByUuidUseCase as UseCase } from '@zro/operations/application';
import { WalletFactory } from '@zro/test/operations/config';

describe('GetWalletByUuidUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const { walletRepository, mockGetWalletRepository } = mockRepository();

    const sut = new UseCase(logger, walletRepository);
    return {
      sut,
      mockGetWalletRepository,
    };
  };

  const mockRepository = () => {
    const walletRepository: WalletRepository = createMock<WalletRepository>();
    const mockGetWalletRepository: jest.Mock = On(walletRepository).get(
      method((mock) => mock.getByUuid),
    );

    return {
      walletRepository,
      mockGetWalletRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get wallet if missing data', async () => {
      const { sut, mockGetWalletRepository } = makeSut();

      await expect(() => sut.execute(null)).rejects.toThrow(
        MissingDataException,
      );

      expect(mockGetWalletRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get wallet successfully ', async () => {
      const { sut, mockGetWalletRepository } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const result = await sut.execute(wallet.uuid);

      expect(result).toBeDefined();
      expect(mockGetWalletRepository).toBeCalledWith(wallet.uuid);
      expect(mockGetWalletRepository).toHaveBeenCalledTimes(1);
    });
  });
});
