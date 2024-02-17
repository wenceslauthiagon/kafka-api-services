import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  WarningTransactionEntity,
  WarningTransactionRepository,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import {
  WarningTransactionEventEmitter,
  WarningTransactionNotFoundException,
  HandleWarningTransactionDeadLetterUseCase as UseCase,
} from '@zro/compliance/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('Test handle warning transaction dead letter use case', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockEmitter = () => {
    const warningTransactionEventEmitter: WarningTransactionEventEmitter =
      createMock<WarningTransactionEventEmitter>();
    const mockFailedEventEmitter: jest.Mock = On(
      warningTransactionEventEmitter,
    ).get(method((mock) => mock.failedWarningTransaction));

    return {
      warningTransactionEventEmitter,
      mockFailedEventEmitter,
    };
  };

  const mockRepository = () => {
    const warningTransactionRepository: WarningTransactionRepository =
      createMock<WarningTransactionRepository>();
    const mockGetWarningByIdTransaction: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.getById));
    const mockUpdateWarningTransaction: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.update));

    return {
      warningTransactionRepository,
      mockGetWarningByIdTransaction,
      mockUpdateWarningTransaction,
    };
  };

  const makeSut = () => {
    const {
      warningTransactionRepository,
      mockGetWarningByIdTransaction,
      mockUpdateWarningTransaction,
    } = mockRepository();

    const { mockFailedEventEmitter, warningTransactionEventEmitter } =
      mockEmitter();

    const sut = new UseCase(
      warningTransactionRepository,
      warningTransactionEventEmitter,
      logger,
    );

    return {
      sut,
      warningTransactionRepository,
      mockGetWarningByIdTransaction,
      mockUpdateWarningTransaction,
      warningTransactionEventEmitter,
      mockFailedEventEmitter,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should handle create warning transaction dead letter successfully', async () => {
      const {
        sut,
        mockFailedEventEmitter,
        mockGetWarningByIdTransaction,
        mockUpdateWarningTransaction,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            status: WarningTransactionStatus.PENDING,
          },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      const result = await sut.execute(warningTransaction.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(warningTransaction.id);
      expect(result.status).toBe(WarningTransactionStatus.FAILED);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdateWarningTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException when there is no id', async () => {
      const {
        sut,
        mockFailedEventEmitter,
        mockGetWarningByIdTransaction,
        mockUpdateWarningTransaction,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransaction).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should thow WarningTransactionNotFoundException when there is no warning transaction', async () => {
      const {
        sut,
        mockFailedEventEmitter,
        mockGetWarningByIdTransaction,
        mockUpdateWarningTransaction,
      } = makeSut();

      const id = faker.datatype.uuid();

      mockGetWarningByIdTransaction.mockResolvedValueOnce(null);

      const test = () => sut.execute(id);

      await expect(test).rejects.toThrow(WarningTransactionNotFoundException);

      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransaction).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should return if warning transaction status is closed', async () => {
      const {
        sut,
        mockFailedEventEmitter,
        mockGetWarningByIdTransaction,
        mockUpdateWarningTransaction,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            status: WarningTransactionStatus.CLOSED,
          },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      await sut.execute(warningTransaction.id);

      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransaction).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should return if warning transaction status is failed', async () => {
      const {
        sut,
        mockFailedEventEmitter,
        mockGetWarningByIdTransaction,
        mockUpdateWarningTransaction,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          {
            status: WarningTransactionStatus.FAILED,
          },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      await sut.execute(warningTransaction.id);

      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdateWarningTransaction).toHaveBeenCalledTimes(0);
    });
  });
});
