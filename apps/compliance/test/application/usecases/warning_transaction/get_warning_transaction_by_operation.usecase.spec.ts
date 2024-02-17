import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WarningTransactionEntity,
  WarningTransactionRepository,
} from '@zro/compliance/domain';
import { OperationEntity } from '@zro/operations/domain';
import { GetWarningTransactionByOperationUseCase as UseCase } from '@zro/compliance/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('GetWarningTransactionByOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const warningTransactionRepository: WarningTransactionRepository =
      createMock<WarningTransactionRepository>();
    const mockGetWarningTransactionByOperation: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.getByOperation));

    return {
      warningTransactionRepository,
      mockGetWarningTransactionByOperation,
    };
  };

  const makeSut = () => {
    const {
      warningTransactionRepository,
      mockGetWarningTransactionByOperation,
    } = mockRepository();

    const sut = new UseCase(logger, warningTransactionRepository);

    return {
      sut,
      mockGetWarningTransactionByOperation,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const { sut, mockGetWarningTransactionByOperation } = makeSut();

      const tests = [
        sut.execute(null),
        sut.execute(new OperationEntity({ id: null })),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create warning transaction successfully', async () => {
      const { sut, mockGetWarningTransactionByOperation } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
        );

      mockGetWarningTransactionByOperation.mockResolvedValueOnce(
        warningTransaction,
      );

      const { operation } = warningTransaction;

      const result = await sut.execute(operation);

      expect(result).toBe(warningTransaction);
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(1);
    });
  });
});
