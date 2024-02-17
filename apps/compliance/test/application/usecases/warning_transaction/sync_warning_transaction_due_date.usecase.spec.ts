import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  WarningTransactionEntity,
  WarningTransactionRepository,
} from '@zro/compliance/domain';
import {
  SyncWarningTransactionDueDateUseCase as UseCase,
  WarningTransactionEventEmitter,
  PixPaymentService,
} from '@zro/compliance/application';
import { WarningTransactionFactory } from '@zro/test/compliance/config';

describe('SyncWarningTransactionDueDateUseCase', () => {
  const makeSut = () => {
    const warningTransactionRepository: WarningTransactionRepository =
      createMock<WarningTransactionRepository>();
    const mockGetAllInAnalysis: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.getAllInAnalysis));

    const mockUpdateRepository: jest.Mock = On(
      warningTransactionRepository,
    ).get(method((mock) => mock.update));

    const warningTransactionEventEmitter: WarningTransactionEventEmitter =
      createMock<WarningTransactionEventEmitter>();
    const mockEventEmitter: jest.Mock = On(warningTransactionEventEmitter).get(
      method((mock) => mock.expiredWarningTransaction),
    );

    const pixPaymentService: PixPaymentService =
      createMock<PixPaymentService>();
    const mockApprovePixDeposit: jest.Mock = On(pixPaymentService).get(
      method((mock) => mock.approvePixDeposit),
    );

    const sut = new UseCase(
      logger,
      warningTransactionRepository,
      warningTransactionEventEmitter,
      pixPaymentService,
    );

    return {
      sut,
      mockGetAllInAnalysis,
      mockApprovePixDeposit,
      mockEventEmitter,
      mockUpdateRepository,
    };
  };
  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should approve pix deposit after 72h in analysis', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetAllInAnalysis,
        mockApprovePixDeposit,
        mockUpdateRepository,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
        );

      const today = new Date();

      const warningTransactions = [
        {
          ...warningTransaction,
          createdAt: today.setDate(today.getDate() - 4),
        },
      ];

      mockGetAllInAnalysis.mockResolvedValueOnce(warningTransactions);

      await sut.execute();

      expect(mockGetAllInAnalysis).toHaveBeenCalledTimes(1);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should not approve pix deposit before 72h in analysis', async () => {
      const {
        sut,
        mockEventEmitter,
        mockGetAllInAnalysis,
        mockApprovePixDeposit,
        mockUpdateRepository,
      } = makeSut();

      const warningTransaction =
        await WarningTransactionFactory.create<WarningTransactionEntity>(
          WarningTransactionEntity.name,
        );

      const today = new Date();

      const warningTransactions = [
        {
          ...warningTransaction,
          createdAt: today.setDate(today.getDate() - 2),
        },
      ];

      mockGetAllInAnalysis.mockResolvedValueOnce(warningTransactions);

      await sut.execute();

      expect(mockGetAllInAnalysis).toHaveBeenCalledTimes(1);
      expect(mockApprovePixDeposit).toHaveBeenCalledTimes(0);
      expect(mockEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });
});
