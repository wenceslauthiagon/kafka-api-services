import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { ReportOperationRepository } from '@zro/reports/domain';
import {
  SyncBankBilletOperationUseCase as UseCase,
  OperationService,
} from '@zro/reports/application';
import {
  TransactionTypeNotFoundException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';
import {
  OperationFactory,
  TransactionTypeFactory,
  WalletAccountFactory,
} from '@zro/test/operations/config';
import {
  OperationEntity,
  TransactionTypeEntity,
  TransactionTypeParticipants,
  WalletAccountEntity,
} from '@zro/operations/domain';

describe('SyncBankBilletOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const zroBankIspb = '26264220';
  const bankBilletOperationTags = 'BBP';
  const currencyTag = 'REAL';

  const makeSut = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetTransactionTypeByTagService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getTransactionTypeByTag));
    const mockGetAllByFilterService: jest.Mock = On(operationService).get(
      method((mock) => mock.getAllOperationsByFilter),
    );
    const mockGetWalletAccountService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletAccountByUserAndCurrency),
    );

    const reportOperationRepository: ReportOperationRepository =
      createMock<ReportOperationRepository>();
    const mockCreateReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(method((mock) => mock.create));
    const mockGetReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(method((mock) => mock.getByOperation));

    const sut = new UseCase(
      logger,
      reportOperationRepository,
      operationService,
      bankBilletOperationTags,
      zroBankIspb,
      currencyTag,
    );
    return {
      sut,
      mockGetTransactionTypeByTagService,
      mockGetAllByFilterService,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
      mockGetWalletAccountService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw TransactionTypeNotFoundException if transaction tag is not found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
      } = makeSut();

      mockGetTransactionTypeByTagService.mockResolvedValueOnce(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(
        TransactionTypeNotFoundException,
      );
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WalletAccountNotFoundException if client wallet account is not found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
      } = makeSut();

      const tag = 'BBP';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.BENEFICIARY,
          },
        );

      const operations = [
        await OperationFactory.create<OperationEntity>(OperationEntity.name, {
          transactionType,
        }),
      ];

      mockGetTransactionTypeByTagService.mockResolvedValueOnce(transactionType);
      mockGetAllByFilterService.mockResolvedValue({
        data: operations,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetReportOperationRepository.mockResolvedValue(null);
      mockGetWalletAccountService.mockResolvedValue(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should not create if no bank billet operations is found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
      } = makeSut();

      const tag = 'BBP';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.BENEFICIARY,
          },
        );

      mockGetTransactionTypeByTagService.mockResolvedValueOnce(transactionType);
      mockGetAllByFilterService.mockResolvedValue({
        data: null,
        page: 1,
        pageSize: 100,
        pageTotal: 0,
        total: 0,
      });

      await sut.execute();

      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should create new Report Operation if bank billet operation is found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
      } = makeSut();

      const tag = 'BBP';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.BENEFICIARY,
          },
        );

      const ownerWalletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const operations = [
        await OperationFactory.create<OperationEntity>(OperationEntity.name, {
          transactionType,
          ownerWalletAccount,
        }),
      ];

      mockGetTransactionTypeByTagService.mockResolvedValue(transactionType);
      mockGetAllByFilterService.mockResolvedValue({
        data: operations,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetReportOperationRepository.mockResolvedValue(null);
      mockGetWalletAccountService.mockResolvedValue(ownerWalletAccount);

      await sut.execute();

      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
    });
  });
});
