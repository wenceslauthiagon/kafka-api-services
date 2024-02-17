import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  WarningTransactionEntity,
  WarningTransactionRepository,
} from '@zro/compliance/domain';
import {
  CreateWarningTransactionUseCase as UseCase,
  WarningTransactionAlreadyExistsException,
  WarningTransactionEventEmitter,
} from '@zro/compliance/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('CreateWarningTransactionUseCase', () => {
  const warningTransactionRepository: WarningTransactionRepository =
    createMock<WarningTransactionRepository>();
  const mockGetWarningTransactionByOperation: jest.Mock = On(
    warningTransactionRepository,
  ).get(method((mock) => mock.getByOperation));
  const mockCreateWarningTransaction: jest.Mock = On(
    warningTransactionRepository,
  ).get(method((mock) => mock.create));

  const warningTransactionEventEmitter: WarningTransactionEventEmitter =
    createMock<WarningTransactionEventEmitter>();
  const mockEventEmitter: jest.Mock = On(warningTransactionEventEmitter).get(
    method((mock) => mock.pendingWarningTransaction),
  );

  beforeEach(() => jest.resetAllMocks());

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params', async () => {
      const usecase = new UseCase(
        logger,
        warningTransactionRepository,
        warningTransactionEventEmitter,
      );

      const invalidInputs = [
        null,
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { operation: null },
        ),
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { transactionTag: null },
        ),
      ];

      for (const input of invalidInputs) {
        const testScript = () => usecase.execute(input);
        await expect(testScript).rejects.toThrow(MissingDataException);
      }

      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(0);
      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create warning transaction if an operation id already exists', async () => {
      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
        );

      mockGetWarningTransactionByOperation.mockResolvedValueOnce(
        warningTransaction,
      );

      const usecase = new UseCase(
        logger,
        warningTransactionRepository,
        warningTransactionEventEmitter,
      );

      const testScript = () => usecase.execute(warningTransaction);

      await expect(testScript).rejects.toThrow(
        WarningTransactionAlreadyExistsException,
      );
      expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(0);
      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should create warning transaction successfully', async () => {
        const warningTransaction =
          await WarningTransactionFactory.create<WarningTransactionEntity>(
            WarningTransactionEntity.name,
          );

        mockGetWarningTransactionByOperation.mockResolvedValueOnce(undefined);

        const usecase = new UseCase(
          logger,
          warningTransactionRepository,
          warningTransactionEventEmitter,
        );

        const result = await usecase.execute(warningTransaction);

        expect(result).toBeDefined();
        expect(result.id).toBeDefined();
        expect(result.operation).toBeDefined();
        expect(result.endToEndId).toBeDefined();
        expect(result.transactionTag).toBeDefined();
        expect(mockGetWarningTransactionByOperation).toHaveBeenCalledTimes(1);
        expect(mockCreateWarningTransaction).toHaveBeenCalledTimes(1);
        expect(mockEventEmitter).toHaveBeenCalledTimes(1);
      });
    });
  });
});
