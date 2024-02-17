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
  HandleWarningTransactionCreatedUseCase as UseCase,
  WarningTransactionEventEmitter,
  WarningTransactionGateway,
  WarningTransactionInvalidStatusException,
  WarningTransactionNotFoundException,
} from '@zro/compliance/application';
import {
  OperationNotFoundException,
  TransactionTypeTagNotFoundException,
} from '@zro/operations/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('Test handle warning transaction created use case', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockEmitter = () => {
    const warningTransactionEventEmitter: WarningTransactionEventEmitter =
      createMock<WarningTransactionEventEmitter>();
    const mockEventEmitter: jest.Mock = On(warningTransactionEventEmitter).get(
      method((mock) => mock.sentWarningTransaction),
    );

    return {
      warningTransactionEventEmitter,
      mockEventEmitter,
    };
  };

  const mockRepository = () => {
    const warningTransactionRepository: WarningTransactionRepository =
      createMock<WarningTransactionRepository>();
    const mockGetWarningByIdTransaction: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.getById));

    return {
      warningTransactionRepository,
      mockGetWarningByIdTransaction,
    };
  };

  const mockGateway = () => {
    const warningTransactionGateway: WarningTransactionGateway =
      createMock<WarningTransactionGateway>();
    const mockCreateWarningTransactionGateway: jest.Mock = On(
      warningTransactionGateway,
    ).get(method((mock) => mock.createWarningTransaction));

    return {
      warningTransactionGateway,
      mockCreateWarningTransactionGateway,
    };
  };

  const makeSut = () => {
    const { warningTransactionRepository, mockGetWarningByIdTransaction } =
      mockRepository();

    const { mockEventEmitter, warningTransactionEventEmitter } = mockEmitter();

    const { mockCreateWarningTransactionGateway, warningTransactionGateway } =
      mockGateway();

    const sut = new UseCase(
      warningTransactionRepository,
      warningTransactionEventEmitter,
      warningTransactionGateway,
      logger,
    );

    return {
      sut,
      warningTransactionRepository,
      mockGetWarningByIdTransaction,
      warningTransactionEventEmitter,
      mockEventEmitter,
      warningTransactionGateway,
      mockCreateWarningTransactionGateway,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle warning transaction created successfully', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { status: WarningTransactionStatus.PENDING },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      const result = await sut.execute(warningTransaction.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(warningTransaction.id);
      expect(result.status).toBe(WarningTransactionStatus.SENT);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException when there is no id', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const test = () => sut.execute(null);

      await expect(test).rejects.toThrow(MissingDataException);

      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(0);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw WarningTransactionNotFoundException when there is no warning transaction', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const id = faker.datatype.uuid();

      mockGetWarningByIdTransaction.mockResolvedValueOnce(null);

      const test = () => sut.execute(id);

      await expect(test).rejects.toThrow(WarningTransactionNotFoundException);

      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw TransactionTypeNotFoundException when there is no transaction type', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { transactionTag: null },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      const test = () => sut.execute(warningTransaction.id);

      await expect(test).rejects.toThrow(TransactionTypeTagNotFoundException);

      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should return if warning transaction status is sent', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { status: WarningTransactionStatus.SENT },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      await sut.execute(warningTransaction.id);

      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw WarningTransactionInvalidStatusException if warning transaction status is closed or failed', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const warningTransactions = [
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { status: WarningTransactionStatus.CLOSED },
        ),

        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { status: WarningTransactionStatus.FAILED },
        ),
      ];

      for (const warningTransaction of warningTransactions) {
        mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

        const testScript = () => sut.execute(warningTransaction.id);

        expect(testScript).rejects.toThrow(
          WarningTransactionInvalidStatusException,
        );
      }

      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(2);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw OperationNotFoundException if operation is not found', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetWarningByIdTransaction,
        mockCreateWarningTransactionGateway,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
          { operation: null },
        );

      mockGetWarningByIdTransaction.mockResolvedValueOnce(warningTransaction);

      const test = () => sut.execute(warningTransaction.id);

      await expect(test).rejects.toThrow(OperationNotFoundException);

      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetWarningByIdTransaction).toHaveBeenCalledTimes(1);
      expect(mockCreateWarningTransactionGateway).toHaveBeenCalledTimes(0);
    });
  });
});
