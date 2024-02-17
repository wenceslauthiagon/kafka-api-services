import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  ReportOperationEntity,
  ReportOperationRepository,
} from '@zro/reports/domain';
import {
  SyncReportsOperationsUsecase as UseCase,
  GenerateOperationReportFailedException,
  ReportGateway,
} from '@zro/reports/application';
import { ReportOperationFactory } from '@zro/test/reports/config';
import { CreateReportGatewayException } from '@zro/e-guardian';

describe('SyncReportOperationUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  const reportOperationFileName = 'VIEW_INTEG_MOVFIN_AUX.txt';

  const mockRepository = () => {
    const reportOperationRepository: ReportOperationRepository =
      createMock<ReportOperationRepository>();
    const mockGetAllPaginatedReportOperationRepository: jest.Mock = On(
      reportOperationRepository,
    ).get(method((mock) => mock.getAllGenerator));

    return {
      reportOperationRepository,
      mockGetAllPaginatedReportOperationRepository,
    };
  };

  const mockGateway = () => {
    const reportGateway: ReportGateway = createMock<ReportGateway>();
    const mockCreateReportGateway: jest.Mock = On(reportGateway).get(
      method((mock) => mock.createReportOperation),
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
    const {
      reportOperationRepository,
      mockGetAllPaginatedReportOperationRepository,
    } = mockRepository();

    const { reportGateway, mockCreateReportGateway, mockSendReportGateway } =
      mockGateway();

    const sut = new UseCase(
      logger,
      reportOperationRepository,
      reportGateway,
      reportOperationFileName,
    );

    return {
      sut,
      mockGetAllPaginatedReportOperationRepository,
      mockCreateReportGateway,
      mockSendReportGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if generate report failed', async () => {
      const {
        sut,
        mockGetAllPaginatedReportOperationRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportOperation =
        await ReportOperationFactory.createMany<ReportOperationEntity>(
          ReportOperationEntity.name,
          3,
        );

      mockGetAllPaginatedReportOperationRepository.mockImplementation(
        () => reportOperation,
      );
      mockCreateReportGateway.mockRejectedValue(
        new CreateReportGatewayException(),
      );

      await expect(sut.execute()).rejects.toThrow(
        GenerateOperationReportFailedException,
      );

      expect(
        mockGetAllPaginatedReportOperationRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(1);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create report operation successfully', async () => {
      const {
        sut,
        mockGetAllPaginatedReportOperationRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportOperations =
        await ReportOperationFactory.createMany<ReportOperationEntity>(
          ReportOperationEntity.name,
          3,
        );

      mockGetAllPaginatedReportOperationRepository.mockImplementation(
        () => reportOperations,
      );

      await sut.execute();

      expect(
        mockGetAllPaginatedReportOperationRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(3);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(1);
    });
  });
});
