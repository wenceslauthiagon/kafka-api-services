import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { TransactionTypeEntity } from '@zro/operations/domain';
import {
  CreateReportOperationByGatewayUseCase as UseCase,
  OperationService,
  UserService,
} from '@zro/reports/application';
import { TransactionTypeNotFoundException } from '@zro/operations/application';
import { ReportOperationFactory } from '@zro/test/reports/config';
import { TransactionTypeFactory } from '@zro/test/operations/config';

describe('CreateReportOperationByGatewayUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const makeSut = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetOperationService: jest.Mock = On(operationService).get(
      method((mock) => mock.getTransactionTypeByTag),
    );
    const userService: UserService = createMock<UserService>();
    const mockGetUserService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByDocument),
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
      userService,
    );

    return {
      sut,
      mockGetOperationService,
      mockGetUserService,
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
    ).get(method((mock) => mock.getByOperation));

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
        mockGetOperationService,
        mockGetUserService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      const testScript = () =>
        sut.execute(
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        );

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if report already exists', async () => {
      const {
        id,
        operation,
        operationType,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBankCode,
        clientBranch,
        clientAccountNumber,
        currency,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const {
        sut,
        mockGetOperationService,
        mockGetUserService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      const result = await sut.execute(
        id,
        operation,
        operationType,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBankCode,
        clientBranch,
        clientAccountNumber,
        currency,
      );
      expect(result).toBeDefined();
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if transaction tag not found', async () => {
      const {
        id,
        operation,
        operationType,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBankCode,
        clientBranch,
        clientAccountNumber,
        currency,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const {
        sut,
        mockGetOperationService,
        mockGetUserService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      mockGetReportOperationRepository.mockResolvedValue(undefined);
      mockGetOperationService.mockResolvedValue(undefined);

      const testScript = () =>
        sut.execute(
          id,
          operation,
          operationType,
          transactionType,
          thirdPart,
          thirdPartBankCode,
          thirdPartBranch,
          thirdPartAccountNumber,
          client,
          clientBankCode,
          clientBranch,
          clientAccountNumber,
          currency,
        );

      await expect(testScript).rejects.toThrow(
        TransactionTypeNotFoundException,
      );
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0004 - Should create successfully', async () => {
      const {
        id,
        operation,
        operationType,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBankCode,
        clientBranch,
        clientAccountNumber,
        currency,
      } = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      const transactionTypeFound =
        await TransactionTypeFactory.create<TransactionTypeEntity>(
          TransactionTypeEntity.name,
        );

      const {
        sut,
        mockGetOperationService,
        mockGetUserService,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      mockGetReportOperationRepository.mockResolvedValue(undefined);
      mockGetOperationService.mockResolvedValue(transactionTypeFound);
      mockGetUserService.mockResolvedValue(client);

      const result = await sut.execute(
        id,
        operation,
        operationType,
        transactionType,
        thirdPart,
        thirdPartBankCode,
        thirdPartBranch,
        thirdPartAccountNumber,
        client,
        clientBankCode,
        clientBranch,
        clientAccountNumber,
        currency,
      );

      expect(result).toBeDefined();
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockGetOperationService).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(1);
    });
  });
});
