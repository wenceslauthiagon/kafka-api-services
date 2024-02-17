import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { ReportUserEntity, ReportUserRepository } from '@zro/reports/domain';
import {
  SyncReportsPaymentsAccountHolderUseCase as UseCase,
  GeneratePaymentsAccountHolderReportFailedException,
  ReportGateway,
} from '@zro/reports/application';
import { ReportUserFactory } from '@zro/test/reports/config';
import { CreateReportGatewayException } from '@zro/e-guardian';

describe('SyncReportPaymentsAccountHolderUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const reportPaymentsAccountHolderFileName = 'VIEW_TITULAR_AUX.txt';

  const mockRepository = () => {
    const reportUserRepository: ReportUserRepository =
      createMock<ReportUserRepository>();
    const mockGetAllPaginatedReportUserRepository: jest.Mock = On(
      reportUserRepository,
    ).get(method((mock) => mock.getAllGeneratorByFilter));

    return {
      reportUserRepository,
      mockGetAllPaginatedReportUserRepository,
    };
  };

  const mockGateway = () => {
    const reportGateway: ReportGateway = createMock<ReportGateway>();
    const mockCreateReportGateway: jest.Mock = On(reportGateway).get(
      method((mock) => mock.createReportPaymentsAccountHolder),
    );
    const mockSendReportGateway: jest.Mock = On(reportGateway).get(
      method((mock) => mock.sendReport),
    );

    return {
      reportGateway,
      mockCreateReportGateway,
      mockSendReportGateway,
    };
  };

  const makeSut = () => {
    const { reportUserRepository, mockGetAllPaginatedReportUserRepository } =
      mockRepository();

    const { reportGateway, mockCreateReportGateway, mockSendReportGateway } =
      mockGateway();

    const sut = new UseCase(
      logger,
      reportUserRepository,
      reportGateway,
      reportPaymentsAccountHolderFileName,
    );

    return {
      sut,
      mockGetAllPaginatedReportUserRepository,
      mockCreateReportGateway,
      mockSendReportGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if generate report failed', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportPaymentsAccountHolder =
        await ReportUserFactory.createMany<ReportUserEntity>(
          ReportUserEntity.name,
          3,
        );

      mockGetAllPaginatedReportUserRepository.mockImplementation(
        () => reportPaymentsAccountHolder,
      );
      mockCreateReportGateway.mockRejectedValue(
        new CreateReportGatewayException(),
      );

      await expect(sut.execute()).rejects.toThrow(
        GeneratePaymentsAccountHolderReportFailedException,
      );

      expect(mockGetAllPaginatedReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(1);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create report payments account holder successfully', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportPaymentsAccountHolder =
        await ReportUserFactory.createMany<ReportUserEntity>(
          ReportUserEntity.name,
          3,
        );

      mockGetAllPaginatedReportUserRepository.mockImplementation(
        () => reportPaymentsAccountHolder,
      );

      await sut.execute();

      expect(mockGetAllPaginatedReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(3);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(1);
    });
  });
});
