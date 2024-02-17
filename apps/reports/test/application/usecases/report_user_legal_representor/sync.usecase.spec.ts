import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  ReportUserLegalRepresentorEntity,
  ReportUserLegalRepresentorRepository,
} from '@zro/reports/domain';
import {
  SyncReportsUserLegalRepresentorUseCase as UseCase,
  ReportGateway,
  GenerateUserLegalRepresentorReportFailedException,
} from '@zro/reports/application';
import { ReportUserLegalRepresentorFactory } from '@zro/test/reports/config';
import { CreateReportGatewayException } from '@zro/e-guardian';

describe('SyncReportsUserLegalRepresentorUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const reportUserLegalRepresentorFileName =
    'VIEW_REPRESENTANTES_TITULAR_AUX.txt';

  const mockRepository = () => {
    const reportUserLegalRepresentorRepository: ReportUserLegalRepresentorRepository =
      createMock<ReportUserLegalRepresentorRepository>();
    const mockGetAllPaginatedReportUserLegalRepresentor: jest.Mock = On(
      reportUserLegalRepresentorRepository,
    ).get(method((mock) => mock.getAllGenerator));

    return {
      reportUserLegalRepresentorRepository,
      mockGetAllPaginatedReportUserLegalRepresentor,
    };
  };

  const mockGateway = () => {
    const reportGateway: ReportGateway = createMock<ReportGateway>();
    const mockCreateReportGateway: jest.Mock = On(reportGateway).get(
      method((mock) => mock.createReportUserRepresentor),
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
      reportUserLegalRepresentorRepository,
      mockGetAllPaginatedReportUserLegalRepresentor,
    } = mockRepository();

    const { reportGateway, mockCreateReportGateway, mockSendReportGateway } =
      mockGateway();

    const sut = new UseCase(
      logger,
      reportUserLegalRepresentorRepository,
      reportGateway,
      reportUserLegalRepresentorFileName,
    );

    return {
      sut,
      mockGetAllPaginatedReportUserLegalRepresentor,
      mockCreateReportGateway,
      mockSendReportGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if generate report failed', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserLegalRepresentor,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportUserLegalRepresentor =
        await ReportUserLegalRepresentorFactory.createMany<ReportUserLegalRepresentorEntity>(
          ReportUserLegalRepresentorEntity.name,
          3,
        );

      mockGetAllPaginatedReportUserLegalRepresentor.mockImplementation(
        () => reportUserLegalRepresentor,
      );
      mockCreateReportGateway.mockRejectedValue(
        new CreateReportGatewayException(),
      );

      await expect(sut.execute()).rejects.toThrow(
        GenerateUserLegalRepresentorReportFailedException,
      );

      expect(
        mockGetAllPaginatedReportUserLegalRepresentor,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(1);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create report user successfully', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserLegalRepresentor,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportUserLegalRepresentor =
        await ReportUserLegalRepresentorFactory.createMany<ReportUserLegalRepresentorEntity>(
          ReportUserLegalRepresentorEntity.name,
          3,
        );

      mockGetAllPaginatedReportUserLegalRepresentor.mockImplementation(
        () => reportUserLegalRepresentor,
      );

      await sut.execute();

      expect(
        mockGetAllPaginatedReportUserLegalRepresentor,
      ).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(3);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(1);
    });
  });
});
