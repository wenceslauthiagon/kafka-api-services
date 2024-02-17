import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';

import {
  HandleCreateReportOperationByPixPaymentConfirmedEventUseCase as UseCase,
  OperationService,
} from '@zro/reports/application';
import {
  CurrencyNotFoundException,
  OperationNotFoundException,
  TransactionTypeNotFoundException,
} from '@zro/operations/application';
import { ReportOperationFactory } from '@zro/test/reports/config';
import {
  CurrencyFactory,
  OperationFactory,
  TransactionTypeFactory,
} from '@zro/test/operations/config';
import {
  CurrencyEntity,
  OperationEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';

describe('HandleCreateReportOperationByPixPaymentConfirmedEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const operationCurrencyTag = 'REAL';
  const zroBankIspb = '26264220';

  const makeSut = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetTransactionTypeByTagService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getTransactionTypeByTag));
    const mockGetCurrencyByTagService: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyByTag),
    );
    const mockGetOperationByIdService: jest.Mock = On(operationService).get(
      method((mock) => mock.getOperationById),
    );

    const {
      reportOperationRepository,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      reportOperationRepository,
      operationService,
      operationCurrencyTag,
      zroBankIspb,
    );
    return {
      sut,
      mockGetTransactionTypeByTagService,
      mockGetCurrencyByTagService,
      mockGetOperationByIdService,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
    };
  };

  const mockRepository = () => {
    const reportOperationRepository: ReportOperationRepository =
      createMock<ReportOperationRepository>();
    const mockCreateReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(method((mock) => mock.create));

    const mockGetReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(method((mock) => mock.getById));

    return {
      reportOperationRepository,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      const testScript = () =>
        sut.execute(null, null, null, null, null, null, null, null, null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if report already exists', async () => {
      const {
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      const result = await sut.execute(
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      );
      expect(result).toBeDefined();
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if transaction tag not found', async () => {
      const {
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      mockGetReportOperationRepository.mockResolvedValue(undefined);
      mockGetTransactionTypeByTagService.mockResolvedValue(undefined);

      const testScript = () =>
        sut.execute(
          id,
          operation,
          transactionType,
          thirdPart,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          client,
          clientBranch,
          clientAccountNumber,
        );

      await expect(testScript).rejects.toThrow(
        TransactionTypeNotFoundException,
      );
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if operation not found', async () => {
      const {
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const transactionTypeFound =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
        );

      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetOperationByIdService,
      } = makeSut();

      mockGetReportOperationRepository.mockResolvedValue(undefined);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        transactionTypeFound,
      );
      mockGetOperationByIdService.mockResolvedValue(undefined);

      const testScript = () =>
        sut.execute(
          id,
          operation,
          transactionType,
          thirdPart,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          client,
          clientBranch,
          clientAccountNumber,
        );

      await expect(testScript).rejects.toThrow(OperationNotFoundException);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationByIdService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if currency not found', async () => {
      const {
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const transactionTypeFound =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
        );

      const operationFound = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetOperationByIdService,
        mockGetCurrencyByTagService,
      } = makeSut();

      mockGetReportOperationRepository.mockResolvedValue(undefined);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        transactionTypeFound,
      );
      mockGetOperationByIdService.mockResolvedValue(operationFound);
      mockGetCurrencyByTagService.mockResolvedValue(undefined);

      const testScript = () =>
        sut.execute(
          id,
          operation,
          transactionType,
          thirdPart,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          client,
          clientBranch,
          clientAccountNumber,
        );

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyByTagService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0006 - Should create successfully', async () => {
      const {
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const transactionTypeFound =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
        );

      const operationFound = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const currencyFound = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const {
        sut,
        mockGetTransactionTypeByTagService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
        mockGetOperationByIdService,
        mockGetCurrencyByTagService,
      } = makeSut();

      mockGetReportOperationRepository.mockResolvedValue(undefined);
      mockGetTransactionTypeByTagService.mockResolvedValue(
        transactionTypeFound,
      );
      mockGetOperationByIdService.mockResolvedValue(operationFound);
      mockGetCurrencyByTagService.mockResolvedValue(currencyFound);

      const result = await sut.execute(
        id,
        operation,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBranch,
        clientAccountNumber,
      );

      expect(result).toBeDefined();
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionTypeByTagService).toHaveBeenCalledTimes(1);
      expect(mockGetOperationByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetCurrencyByTagService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(1);
    });
  });
});
