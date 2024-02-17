import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { GetActiveTransactionTypeByTagUseCase as UseCase } from '@zro/operations/application';
import {
  TransactionTypeEntity,
  TransactionTypeRepository,
  TransactionTypeState,
} from '@zro/operations/domain';
import { TransactionTypeFactory } from '@zro/test/operations/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';

describe('GetActiveTransactionTypeByTagUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const transactionTypeRepository: TransactionTypeRepository =
      createMock<TransactionTypeRepository>();
    const mockGetActiveByTagRepository: jest.Mock = On(
      transactionTypeRepository,
    ).get(method((mock) => mock.getActiveByTag));

    return {
      transactionTypeRepository,
      mockGetActiveByTagRepository,
    };
  };

  const makeSut = () => {
    const { transactionTypeRepository, mockGetActiveByTagRepository } =
      mockRepository();

    const sut = new UseCase(logger, transactionTypeRepository);

    return {
      sut,
      mockGetActiveByTagRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not get if missing params', async () => {
      const { sut, mockGetActiveByTagRepository } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);
      expect(mockGetActiveByTagRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get successfully', async () => {
      const { sut, mockGetActiveByTagRepository } = makeSut();

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          { state: TransactionTypeState.ACTIVE },
        );

      mockGetActiveByTagRepository.mockResolvedValue(transactionType);

      const result = await sut.execute(transactionType.tag);

      expect(result).toBeDefined();
      expect(result.id).toBe(transactionType.id);
      expect(result.tag).toBe(transactionType.tag);
      expect(result.state).toBe(TransactionTypeState.ACTIVE);
      expect(mockGetActiveByTagRepository).toHaveBeenCalledTimes(1);
      expect(mockGetActiveByTagRepository).toHaveBeenCalledWith(
        transactionType.tag,
      );
    });
  });
});
