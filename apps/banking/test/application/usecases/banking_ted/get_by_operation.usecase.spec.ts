import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { BankingTedEntity, BankingTedRepository } from '@zro/banking/domain';
import { GetBankingTedByOperationUseCase as UseCase } from '@zro/banking/application';
import { BankingTedFactory } from '@zro/test/banking/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';

describe('GetBankingTedByOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const bankingTedRepository: BankingTedRepository =
      createMock<BankingTedRepository>();
    const mockGetByOperation: jest.Mock = On(bankingTedRepository).get(
      method((mock) => mock.getByOperation),
    );

    return {
      bankingTedRepository,
      mockGetByOperation,
    };
  };

  const makeSut = () => {
    const { bankingTedRepository, mockGetByOperation } = mockRepository();

    const sut = new UseCase(logger, bankingTedRepository);

    return {
      sut,
      mockGetByOperation,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get BankingTed successfully by Operation', async () => {
      const { sut, mockGetByOperation } = makeSut();

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
      );

      const result = await sut.execute(bankingTed.operation);

      expect(result).toBeDefined();
      expect(mockGetByOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException when missing params', async () => {
      const { sut, mockGetByOperation } = makeSut();

      const testScript = () => sut.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByOperation).toHaveBeenCalledTimes(0);
    });
  });
});
