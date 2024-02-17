import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  WalletAccountEntity,
  WalletAccountRepository,
  WalletEntity,
} from '@zro/operations/domain';
import { GetWalletAccountByWalletAndUuidUseCase as UseCase } from '@zro/operations/application';
import {
  WalletFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';

describe('GetWalletAccountByWalletAndUuidUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const walletAccountRepository: WalletAccountRepository =
      createMock<WalletAccountRepository>();
    const mockGetByWalletAndUuidRepository: jest.Mock = On(
      walletAccountRepository,
    ).get(method((mock) => mock.getByWalletAndUuid));

    return {
      walletAccountRepository,
      mockGetByWalletAndUuidRepository,
    };
  };

  const makeSut = () => {
    const { walletAccountRepository, mockGetByWalletAndUuidRepository } =
      mockRepository();

    const sut = new UseCase(logger, walletAccountRepository);

    return {
      sut,
      mockGetByWalletAndUuidRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get wallet account if missing data', async () => {
      const { sut, mockGetByWalletAndUuidRepository } = makeSut();

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const tests = [
        () => sut.execute(null, null),
        () => sut.execute(wallet, null),
        () => sut.execute(new WalletEntity({}), wallet.uuid),
        () => sut.execute(null, wallet.uuid),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByWalletAndUuidRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get wallet account successfully ', async () => {
      const { sut, mockGetByWalletAndUuidRepository } = makeSut();

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const { wallet, uuid } = walletAccount;

      mockGetByWalletAndUuidRepository.mockResolvedValueOnce(walletAccount);

      const result = await sut.execute(wallet, uuid);

      expect(result).toBeDefined();
      expect(result.id).toBe(walletAccount.id);
      expect(result.uuid).toBe(uuid);
      expect(result.wallet.uuid).toBe(wallet.uuid);
      expect(mockGetByWalletAndUuidRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByWalletAndUuidRepository).toBeCalledWith(wallet, uuid);
    });
  });
});
