import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { ReportOperationRepository } from '@zro/reports/domain';
import {
  SyncTedOperationUseCase as UseCase,
  OperationService,
  BankingService,
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
import {
  BankingTedFactory,
  BankingTedReceivedFactory,
} from '@zro/test/banking/config';
import {
  BankingTedEntity,
  BankingTedReceivedEntity,
} from '@zro/banking/domain';
import {
  BankingTedNotFoundException,
  BankingTedReceivedNotFoundException,
} from '@zro/banking/application';

describe('SyncTedOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const zroBankIspb = '26264220';
  const tedOperationTags = 'TEDRECEIVE';
  const currencyTag = 'REAL';
  const tedReceiveTag = 'TEDRECEIVE';
  const tedSentTag = 'TED';

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

    const bankingService: BankingService = createMock<BankingService>();
    const mockGetBankingTedReceivedByOperation: jest.Mock = On(
      bankingService,
    ).get(method((mock) => mock.getBankingTedReceivedByOperation));
    const mockGetBankingTedByOperation: jest.Mock = On(bankingService).get(
      method((mock) => mock.getBankingTedByOperation),
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
      bankingService,
      tedOperationTags,
      zroBankIspb,
      currencyTag,
      tedReceiveTag,
      tedSentTag,
    );
    return {
      sut,
      mockGetTransactionTypeByTagService,
      mockGetAllByFilterService,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
      mockGetWalletAccountService,
      mockGetBankingTedReceivedByOperation,
      mockGetBankingTedByOperation,
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
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
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
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should throw WalletAccountNotFoundException if client wallet account is not found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
      } = makeSut();

      const tag = 'TEDRECEIVE';

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
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if no TED operations is found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
      } = makeSut();

      const tag = 'TEDRECEIVE';

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
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw BankingTedReceivedNotFoundException if TED is not found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
      } = makeSut();

      const tag = 'TEDRECEIVE';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.BENEFICIARY,
          },
        );

      const beneficiaryWalletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const operations = [
        await OperationFactory.create<OperationEntity>(
          OperationEntity.name,

          {
            transactionType,
            beneficiaryWalletAccount,
          },
        ),
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
      mockGetWalletAccountService.mockResolvedValue(beneficiaryWalletAccount);
      mockGetBankingTedReceivedByOperation.mockResolvedValue(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(
        BankingTedReceivedNotFoundException,
      );
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw BankingTedNotFoundException if TED is not found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
      } = makeSut();

      const tag = 'TED';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.OWNER,
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
      mockGetBankingTedByOperation.mockResolvedValue(null);

      const testScript = () => sut.execute();

      await expect(testScript).rejects.toThrow(BankingTedNotFoundException);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create new Report Operation if received TED operation is found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
      } = makeSut();

      const tag = 'TEDRECEIVE';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.BENEFICIARY,
          },
        );

      const beneficiaryWalletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
        );

      const operations = [
        await OperationFactory.create<OperationEntity>(OperationEntity.name, {
          transactionType,
          beneficiaryWalletAccount,
        }),
      ];

      const bankingTedReceived =
        await BankingTedReceivedFactory.create<BankingTedReceivedEntity>(
          BankingTedReceivedEntity.name,
          {
            operation: operations[0],
          },
        );

      mockGetTransactionTypeByTagService.mockResolvedValue(transactionType);
      mockGetAllByFilterService.mockResolvedValue({
        data: operations,
        page: 1,
        pageSize: 100,
        pageTotal: 1,
        total: 1,
      });
      mockGetReportOperationRepository.mockResolvedValue(null);
      mockGetWalletAccountService.mockResolvedValue(beneficiaryWalletAccount);
      mockGetBankingTedReceivedByOperation.mockResolvedValue(
        bankingTedReceived,
      );

      await sut.execute();

      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should create new Report Operation if sent TED operation is found.', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockGetAllByFilterService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetWalletAccountService,
        mockGetBankingTedReceivedByOperation,
        mockGetBankingTedByOperation,
      } = makeSut();

      const tag = 'TED';

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
          {
            tag,
            participants: TransactionTypeParticipants.OWNER,
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

      const bankingTed = await BankingTedFactory.create<BankingTedEntity>(
        BankingTedEntity.name,
        {
          operation: operations[0],
        },
      );

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
      mockGetBankingTedByOperation.mockResolvedValue(bankingTed);

      await sut.execute();

      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetAllByFilterService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountService).toHaveBeenCalledTimes(1);
      expect(mockGetBankingTedReceivedByOperation).toHaveBeenCalledTimes(0);
      expect(mockGetBankingTedByOperation).toHaveBeenCalledTimes(1);
    });
  });
});
