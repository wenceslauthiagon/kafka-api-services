import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { ReportUserEntity, ReportUserRepository } from '@zro/reports/domain';
import {
  SyncReportsUsersUseCase as UseCase,
  GenerateUserReportFailedException,
  ReportGateway,
} from '@zro/reports/application';
import { ReportUserFactory } from '@zro/test/reports/config';
import { CreateReportGatewayException } from '@zro/e-guardian';

describe('SyncReportUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const reportUserFileName = 'VIEW_CLIENTES_AUX.txt';

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
      method((mock) => mock.createReportUser),
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
      reportUserFileName,
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

      const reportUsers = await ReportUserFactory.createMany<ReportUserEntity>(
        ReportUserEntity.name,
        3,
      );

      mockGetAllPaginatedReportUserRepository.mockImplementation(
        () => reportUsers,
      );
      mockCreateReportGateway.mockRejectedValue(
        new CreateReportGatewayException(),
      );

      await expect(sut.execute()).rejects.toThrow(
        GenerateUserReportFailedException,
      );

      expect(mockGetAllPaginatedReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(1);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should create report user successfully', async () => {
      const {
        sut,
        mockGetAllPaginatedReportUserRepository,
        mockCreateReportGateway,
        mockSendReportGateway,
      } = makeSut();

      const reportUsers = await ReportUserFactory.createMany<ReportUserEntity>(
        ReportUserEntity.name,
        3,
      );

      mockGetAllPaginatedReportUserRepository.mockImplementation(
        () => reportUsers,
      );

      await sut.execute();

      expect(mockGetAllPaginatedReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateReportGateway).toHaveBeenCalledTimes(3);
      expect(mockSendReportGateway).toHaveBeenCalledTimes(1);
    });
  });
});
