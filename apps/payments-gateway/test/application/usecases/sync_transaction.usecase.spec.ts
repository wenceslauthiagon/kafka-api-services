import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  TransactionEntity,
  TransactionRepository,
} from '@zro/payments-gateway/domain';
import {
  ReportService,
  SyncTransactionUseCase as UseCase,
} from '@zro/payments-gateway/application';
import { TransactionFactory } from '@zro/test/payments-gateway/config';

describe('SyncTransactionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const {
      transactionRepository,
      mockUpdateTransaction,
      mockGetAllTransaction,
    } = mockRepository();

    const { reportService, mockCreateService } = mockService();

    const sut = new UseCase(logger, transactionRepository, reportService);
    return {
      sut,
      mockUpdateTransaction,
      mockGetAllTransaction,
      mockCreateService,
    };
  };

  const mockRepository = () => {
    const transactionRepository: TransactionRepository =
      createMock<TransactionRepository>();
    const mockUpdateTransaction: jest.Mock = On(transactionRepository).get(
      method((mock) => mock.update),
    );
    const mockGetAllTransaction: jest.Mock = On(transactionRepository).get(
      method((mock) => mock.getAll),
    );

    return {
      transactionRepository,
      mockUpdateTransaction,
      mockGetAllTransaction,
    };
  };

  const mockService = () => {
    const reportService: ReportService = createMock<ReportService>();
    const mockCreateService: jest.Mock = On(reportService).get(
      method((mock) => mock.createReportOperation),
    );

    return {
      reportService,
      mockCreateService,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should sync transactions', async () => {
      const {
        sut,
        mockUpdateTransaction,
        mockGetAllTransaction,
        mockCreateService,
      } = makeSut();

      const transactions =
        await TransactionFactory.createMany<TransactionEntity>(
          TransactionEntity.name,
          2,
        );

      mockGetAllTransaction.mockResolvedValue(transactions);

      await sut.execute();

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(2);
      expect(mockGetAllTransaction).toHaveBeenCalledTimes(1);
      expect(mockCreateService).toHaveBeenCalledTimes(2);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not sync transactions when not found', async () => {
      const {
        sut,
        mockUpdateTransaction,
        mockGetAllTransaction,
        mockCreateService,
      } = makeSut();

      mockGetAllTransaction.mockResolvedValue([]);

      await sut.execute();

      expect(mockUpdateTransaction).toHaveBeenCalledTimes(0);
      expect(mockGetAllTransaction).toHaveBeenCalledTimes(1);
      expect(mockCreateService).toHaveBeenCalledTimes(0);
    });
  });
});
