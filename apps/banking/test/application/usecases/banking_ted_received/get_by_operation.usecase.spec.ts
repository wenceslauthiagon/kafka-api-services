import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  BankingTedReceivedEntity,
  BankingTedReceivedRepository,
} from '@zro/banking/domain';
import { GetBankingTedReceivedByOperationUseCase as UseCase } from '@zro/banking/application';
import { BankingTedReceivedFactory } from '@zro/test/banking/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';

describe('GetBankingTedReceivedByOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const bankingTedReceivedRepository: BankingTedReceivedRepository =
      createMock<BankingTedReceivedRepository>();
    const mockGetByOperation: jest.Mock = On(bankingTedReceivedRepository).get(
      method((mock) => mock.getByOperation),
    );

    return {
      bankingTedReceivedRepository,
      mockGetByOperation,
    };
  };

  const makeSut = () => {
    const { bankingTedReceivedRepository, mockGetByOperation } =
      mockRepository();

    const sut = new UseCase(logger, bankingTedReceivedRepository);

    return {
      sut,
      mockGetByOperation,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should get BankingTedReceived successfully by Operation', async () => {
      const { sut, mockGetByOperation } = makeSut();

      const bankingTedReceived =
        await BankingTedReceivedFactory.create<BankingTedReceivedEntity>(
          BankingTedReceivedEntity.name,
        );

      const result = await sut.execute(bankingTedReceived.operation);

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
