import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import { CreateReportOperationUseCase as UseCase } from '@zro/reports/application';
import { ReportOperationFactory } from '@zro/test/reports/config';

describe('CreateReportOperationUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const reportOperationRepository: ReportOperationRepository =
      createMock<ReportOperationRepository>();
    const mockCreateReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(method((mock) => mock.create));

    const mockGetReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(
      method(
        (mock) => mock.getByOperationAndClientAccountNumberAndOperationType,
      ),
    );

    return {
      reportOperationRepository,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
    };
  };

  const makeSut = () => {
    const {
      reportOperationRepository,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
    } = mockRepository();

    const sut = new UseCase(logger, reportOperationRepository);

    return {
      sut,
      mockCreateReportOperationRepository,
      mockGetReportOperationRepository,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
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
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if report already exists', async () => {
      const {
        sut,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      const report = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      mockGetReportOperationRepository.mockResolvedValue(report);

      const result = await sut.execute(
        report.id,
        report.operation,
        report.operationType,
        report.transactionType,
        report.thirdPart,
        report.thirdPartBankCode,
        report.thirdPartBranch,
        report.thirdPartAccountNumber,
        report.client,
        report.clientBankCode,
        report.clientBranch,
        report.clientAccountNumber,
        report.currency,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(report);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0003 - Should create successfully', async () => {
      const {
        sut,
        mockCreateReportOperationRepository,
        mockGetReportOperationRepository,
      } = makeSut();

      const report = await ReportOperationFactory.create<ReportOperationEntity>(
        ReportOperationEntity.name,
      );

      mockGetReportOperationRepository.mockResolvedValue(null);
      mockCreateReportOperationRepository.mockResolvedValue(report);

      const result = await sut.execute(
        report.id,
        report.operation,
        report.operationType,
        report.transactionType,
        report.thirdPart,
        report.thirdPartBankCode,
        report.thirdPartBranch,
        report.thirdPartAccountNumber,
        report.client,
        report.clientBankCode,
        report.clientBranch,
        report.clientAccountNumber,
        report.currency,
      );

      expect(result).toBeDefined();
      expect(result).toMatchObject(report);
      expect(mockGetReportOperationRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateReportOperationRepository).toHaveBeenCalledTimes(1);
    });
  });
});
