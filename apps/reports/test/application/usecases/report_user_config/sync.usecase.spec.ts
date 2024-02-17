import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  ReportUserConfigEntity,
  ReportUserConfigRepository,
} from '@zro/reports/domain';
import {
  SyncReportsUserConfigsUseCase as UseCase,
  GenerateUserConfigReportFailedException,
  ReportGateway,
} from '@zro/reports/application';
import { ReportUserConfigFactory } from '@zro/test/reports/config';
import { CreateReportGatewayException } from '@zro/e-guardian';

describe('SyncReportUserConfigUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const reportUserConfigFileName = 'VIEW_TP_CLIENTE.txt';

  const mockRepository = () => {
    const reportUserConfigRepository: ReportUserConfigRepository =
      createMock<ReportUserConfigRepository>();
    const mockGetAllPaginatedReportUserConfigRepository: jest.Mock = On(
      reportUserConfigRepository,
    ).get(method((mock) => mock.getAllGenerator));

    return {
      reportUserConfigRepository,
      mockGetAllPaginatedReportUserConfigRepository,
    };
  };

  const mockGateway = () => {
    const reportGateway: ReportGateway = createMock<ReportGateway>();
    const mockCreateReportGateway: jest.Mock = On(reportGateway).get(
      method((mock) => mock.createReportUserConfig),
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
      reportUserConfigRepository,
      mockGetAllPaginatedReportUserConfigRepository,
    } = mockRepository();

    const { reportGateway, mockCreateReportGateway, mockSendReportGateway } =
      mockGateway();

    const sut = new UseCase(
      logger,
      reportUserConfigRepository,
      reportGateway,
      reportUserConfigFileName,
    );

    return {
      sut,
      mockGetAllPaginatedReportUserConfigRepository,
      mockCreateReportGateway,
      mockSendReportGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if generate report failed', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserConfigRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportUsersConfig =
        await ReportUserConfigFactory.createMany<ReportUserConfigEntity>(
          ReportUserConfigEntity.name,
          3,
        );

      mockGetAllPaginatedReportUserConfigRepository.mockImplementation(
        () => reportUsersConfig,
      );
      mockCreateReportGateway.mockRejectedValue(
        new CreateReportGatewayException(),
      );

      await expect(sut.execute()).rejects.toThrow(
        GenerateUserConfigReportFailedException,
      );

      expect(
        mockGetAllPaginatedReportUserConfigRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(1);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create report user config successfully', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserConfigRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportUserConfigs =
        await ReportUserConfigFactory.createMany<ReportUserConfigEntity>(
          ReportUserConfigEntity.name,
          3,
        );

      mockGetAllPaginatedReportUserConfigRepository.mockImplementation(
        () => reportUserConfigs,
      );

      await sut.execute();

      expect(
        mockGetAllPaginatedReportUserConfigRepository,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(3);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(1);
    });
  });
});
