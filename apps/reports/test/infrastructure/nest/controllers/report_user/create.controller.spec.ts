import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserLimitEntity } from '@zro/operations/domain';
import { ReportUserEntity } from '@zro/reports/domain';
import { AdminEntity } from '@zro/admin/domain';
import {
  AdminServiceKafka,
  CreateReportUserMicroserviceController as Controller,
  OperationServiceKafka,
  ReportUserDatabaseRepository,
  ReportUserModel,
} from '@zro/reports/infrastructure';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { CreateReportUserRequest } from '@zro/reports/interface';
import { ReportUserFactory } from '@zro/test/reports/config';

describe('CreateReportUserMicroserviceController', () => {
  beforeEach(() => jest.resetAllMocks());

  let module: TestingModule;
  let controller: Controller;
  let reportUserRepository: ReportUserDatabaseRepository;

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockAllUserLimitsService: jest.Mock = On(operationService).get(
    method((mock) => mock.getAllUserLimits),
  );
  const adminService: AdminServiceKafka = createMock<AdminServiceKafka>();
  const mockGetAdminByIdService: jest.Mock = On(adminService).get(
    method((mock) => mock.getById),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    reportUserRepository = new ReportUserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateReportUser', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - should throw if missing params', async () => {
        const message: CreateReportUserRequest = {
          id: null,
          type: null,
          userId: null,
          fullName: null,
          phoneNumber: null,
          document: null,
          userDeletedAt: null,
          userUpdatedAt: null,
          state: null,
          email: null,
          addressStreet: null,
          addressNumber: null,
          addressCity: null,
          addressFederativeUnit: null,
          addressCountry: null,
          addressZipCode: null,
          onboardingUpdatedAt: null,
          onboardingReviewAssignee: null,
        };

        const testScript = () =>
          controller.execute(
            reportUserRepository,
            adminService,
            operationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockAllUserLimitsService).toHaveBeenCalledTimes(0);
        expect(mockGetAdminByIdService).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should update report user successfully', async () => {
        const reportUser = await ReportUserFactory.create<ReportUserModel>(
          ReportUserModel.name,
        );

        mockGetAdminByIdService.mockResolvedValue(
          new AdminEntity({ name: reportUser.adminName }),
        );
        mockAllUserLimitsService.mockResolvedValue([
          new UserLimitEntity({ dailyLimit: reportUser.dailyLimit }),
        ]);

        const message: CreateReportUserRequest = {
          id: faker.datatype.uuid(),
          type: reportUser.type,
          userId: reportUser.userId,
          fullName: reportUser.fullName,
          phoneNumber: reportUser.phoneNumber,
          document: reportUser.document,
          userDeletedAt: reportUser.deletedAt,
          userUpdatedAt: reportUser.updatedAt,
          state: reportUser.state,
          email: reportUser.email,
          addressStreet: reportUser.addressStreet,
          addressNumber: reportUser.addressNumber,
          addressCity: reportUser.addressCity,
          addressFederativeUnit: reportUser.addressFederativeUnit,
          addressCountry: reportUser.addressCountry,
          addressZipCode: reportUser.addressZipCode,
          onboardingUpdatedAt: reportUser.onboardingUpdatedAt,
          onboardingReviewAssignee: faker.datatype.number({
            min: 1,
            max: 99999,
          }),
        };

        const result = await controller.execute(
          reportUserRepository,
          adminService,
          operationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(mockAllUserLimitsService).toHaveBeenCalledTimes(1);
        expect(mockGetAdminByIdService).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should create report user successfully', async () => {
        const reportUser = await ReportUserFactory.create<ReportUserEntity>(
          ReportUserEntity.name,
        );

        mockGetAdminByIdService.mockResolvedValue(reportUser.admin);
        mockAllUserLimitsService.mockResolvedValue([reportUser.userLimit]);

        const message: CreateReportUserRequest = {
          id: reportUser.id,
          type: reportUser.user.type,
          userId: reportUser.user.uuid,
          fullName: reportUser.user.fullName,
          phoneNumber: reportUser.user.phoneNumber,
          document: reportUser.user.document,
          userDeletedAt: reportUser.user.deletedAt,
          userUpdatedAt: reportUser.user.updatedAt,
          state: reportUser.user.state,
          email: reportUser.user.email,
          addressStreet: reportUser.address.street,
          addressNumber: reportUser.address.number,
          addressCity: reportUser.address.city,
          addressFederativeUnit: reportUser.address.federativeUnit,
          addressCountry: reportUser.address.country,
          addressZipCode: reportUser.address.zipCode,
          onboardingUpdatedAt: reportUser.onboarding.updatedAt,
          onboardingReviewAssignee: faker.datatype.number({
            min: 1,
            max: 99999,
          }),
        };

        const result = await controller.execute(
          reportUserRepository,
          adminService,
          operationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(mockAllUserLimitsService).toHaveBeenCalledTimes(1);
        expect(mockGetAdminByIdService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
