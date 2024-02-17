import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import { ReportUserEntity, ReportUserRepository } from '@zro/reports/domain';
import {
  CreateReportUserUseCase as UseCase,
  OperationService,
  AdminService,
} from '@zro/reports/application';
import { ReportUserFactory } from '@zro/test/reports/config';
import { UserEntity } from '@zro/users/domain';
import { v4 as uuidV4 } from 'uuid';

describe('CreateReportUserUseCase', () => {
  beforeEach(() => jest.resetAllMocks());

  const mockRepository = () => {
    const reportUserRepository: ReportUserRepository =
      createMock<ReportUserRepository>();
    const mockGetByIdReportUserRepository: jest.Mock = On(
      reportUserRepository,
    ).get(method((mock) => mock.getById));
    const mockGetReportUserRepository: jest.Mock = On(reportUserRepository).get(
      method((mock) => mock.getByUser),
    );
    const mockCreateReportUserRepository: jest.Mock = On(
      reportUserRepository,
    ).get(method((mock) => mock.create));
    const mockUpdateReportUserRepository: jest.Mock = On(
      reportUserRepository,
    ).get(method((mock) => mock.update));

    return {
      reportUserRepository,
      mockGetByIdReportUserRepository,
      mockGetReportUserRepository,
      mockCreateReportUserRepository,
      mockUpdateReportUserRepository,
    };
  };

  const mockService = () => {
    const adminService: AdminService = createMock<AdminService>();
    const mockGetAdminByIdService: jest.Mock = On(adminService).get(
      method((mock) => mock.getById),
    );

    const operationService: OperationService = createMock<OperationService>();
    const mockGetAllUserLimitsService: jest.Mock = On(operationService).get(
      method((mock) => mock.getAllUserLimits),
    );

    return {
      adminService,
      mockGetAdminByIdService,
      operationService,
      mockGetAllUserLimitsService,
    };
  };

  const makeSut = () => {
    const {
      reportUserRepository,
      mockGetByIdReportUserRepository,
      mockGetReportUserRepository,
      mockCreateReportUserRepository,
      mockUpdateReportUserRepository,
    } = mockRepository();

    const {
      adminService,
      mockGetAdminByIdService,
      operationService,
      mockGetAllUserLimitsService,
    } = mockService();

    const sut = new UseCase(
      logger,
      reportUserRepository,
      adminService,
      operationService,
    );

    return {
      sut,
      mockGetByIdReportUserRepository,
      mockGetReportUserRepository,
      mockCreateReportUserRepository,
      mockUpdateReportUserRepository,
      mockGetAdminByIdService,
      mockGetAllUserLimitsService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetByIdReportUserRepository,
        mockGetReportUserRepository,
        mockCreateReportUserRepository,
        mockUpdateReportUserRepository,
        mockGetAdminByIdService,
        mockGetAllUserLimitsService,
      } = makeSut();

      const tests = [
        () => sut.execute(null, null, null, null, null, null),
        () => sut.execute(null, new UserEntity({}), null, null, null, null),
        () => sut.execute(uuidV4(), new UserEntity({}), null, null, null, null),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }

      expect(mockGetByIdReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockGetReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledTimes(0);
      expect(mockGetAdminByIdService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateReportUserRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should not create or update if already exists for the same id', async () => {
      const {
        sut,
        mockGetByIdReportUserRepository,
        mockGetReportUserRepository,
        mockCreateReportUserRepository,
        mockUpdateReportUserRepository,
        mockGetAdminByIdService,
        mockGetAllUserLimitsService,
      } = makeSut();

      const reportUser = await ReportUserFactory.create<ReportUserEntity>(
        ReportUserEntity.name,
      );

      const {
        id,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      } = reportUser;

      mockGetByIdReportUserRepository.mockResolvedValue(reportUser);

      const result = await sut.execute(
        id,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      );

      expect(result).toBeDefined();
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledWith(id);
      expect(mockGetReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledTimes(0);
      expect(mockGetAdminByIdService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateReportUserRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should update if already exists for user successfully', async () => {
      const {
        sut,
        mockGetByIdReportUserRepository,
        mockGetReportUserRepository,
        mockCreateReportUserRepository,
        mockUpdateReportUserRepository,
        mockGetAdminByIdService,
        mockGetAllUserLimitsService,
      } = makeSut();

      const reportUser = await ReportUserFactory.create<ReportUserEntity>(
        ReportUserEntity.name,
      );

      const {
        id,
        user,
        address,
        onboarding,
        userLimit,
        admin,
        occupation,
        userLegalAdditionalInfo,
      } = reportUser;

      onboarding.reviewAssignee = admin.id;

      mockGetByIdReportUserRepository.mockResolvedValue(null);
      mockGetReportUserRepository.mockResolvedValue(reportUser);
      mockGetAllUserLimitsService.mockResolvedValue([userLimit]);
      mockGetAdminByIdService.mockResolvedValue(admin);

      const result = await sut.execute(
        id,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      );

      expect(result).toBeDefined();
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledWith(id);
      expect(mockGetReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportUserRepository).toHaveBeenCalledWith(user);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledTimes(1);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledWith(user);
      expect(mockGetAdminByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetAdminByIdService).toHaveBeenCalledWith(admin.id);
      expect(mockCreateReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateReportUserRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should create successfully', async () => {
      const {
        sut,
        mockGetByIdReportUserRepository,
        mockGetReportUserRepository,
        mockCreateReportUserRepository,
        mockUpdateReportUserRepository,
        mockGetAdminByIdService,
        mockGetAllUserLimitsService,
      } = makeSut();

      const reportUser = await ReportUserFactory.create<ReportUserEntity>(
        ReportUserEntity.name,
      );

      const {
        id,
        user,
        address,
        onboarding,
        userLimit,
        admin,
        occupation,
        userLegalAdditionalInfo,
      } = reportUser;

      onboarding.reviewAssignee = admin.id;

      mockGetByIdReportUserRepository.mockResolvedValue(null);
      mockGetReportUserRepository.mockResolvedValue(null);
      mockGetAllUserLimitsService.mockResolvedValue([userLimit]);
      mockGetAdminByIdService.mockResolvedValue(admin);

      const result = await sut.execute(
        id,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      );

      expect(result).toBeDefined();
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledWith(id);
      expect(mockGetReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportUserRepository).toHaveBeenCalledWith(user);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledTimes(1);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledWith(user);
      expect(mockGetAdminByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetAdminByIdService).toHaveBeenCalledWith(admin.id);
      expect(mockCreateReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateReportUserRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should update if already exists for user without admin successfully', async () => {
      const {
        sut,
        mockGetByIdReportUserRepository,
        mockGetReportUserRepository,
        mockCreateReportUserRepository,
        mockUpdateReportUserRepository,
        mockGetAdminByIdService,
        mockGetAllUserLimitsService,
      } = makeSut();

      const reportUser = await ReportUserFactory.create<ReportUserEntity>(
        ReportUserEntity.name,
      );

      const {
        id,
        user,
        address,
        onboarding,
        userLimit,
        admin,
        occupation,
        userLegalAdditionalInfo,
      } = reportUser;

      mockGetByIdReportUserRepository.mockResolvedValue(null);
      mockGetReportUserRepository.mockResolvedValue(reportUser);
      mockGetAllUserLimitsService.mockResolvedValue([userLimit]);
      mockGetAdminByIdService.mockResolvedValue(admin);

      const result = await sut.execute(
        id,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      );

      expect(result).toBeDefined();
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledWith(id);
      expect(mockGetReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportUserRepository).toHaveBeenCalledWith(user);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledTimes(1);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledWith(user);
      expect(mockGetAdminByIdService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportUserRepository).toHaveBeenCalledTimes(0);
      expect(mockUpdateReportUserRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should create without admin successfully', async () => {
      const {
        sut,
        mockGetByIdReportUserRepository,
        mockGetReportUserRepository,
        mockCreateReportUserRepository,
        mockUpdateReportUserRepository,
        mockGetAdminByIdService,
        mockGetAllUserLimitsService,
      } = makeSut();

      const reportUser = await ReportUserFactory.create<ReportUserEntity>(
        ReportUserEntity.name,
      );

      const {
        id,
        user,
        address,
        onboarding,
        userLimit,
        admin,
        occupation,
        userLegalAdditionalInfo,
      } = reportUser;

      mockGetByIdReportUserRepository.mockResolvedValue(null);
      mockGetReportUserRepository.mockResolvedValue(null);
      mockGetAllUserLimitsService.mockResolvedValue([userLimit]);
      mockGetAdminByIdService.mockResolvedValue(admin);

      const result = await sut.execute(
        id,
        user,
        address,
        onboarding,
        occupation,
        userLegalAdditionalInfo,
      );

      expect(result).toBeDefined();
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetByIdReportUserRepository).toHaveBeenCalledWith(id);
      expect(mockGetReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockGetReportUserRepository).toHaveBeenCalledWith(user);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledTimes(1);
      expect(mockGetAllUserLimitsService).toHaveBeenCalledWith(user);
      expect(mockGetAdminByIdService).toHaveBeenCalledTimes(0);
      expect(mockCreateReportUserRepository).toHaveBeenCalledTimes(1);
      expect(mockUpdateReportUserRepository).toHaveBeenCalledTimes(0);
    });
  });
});
