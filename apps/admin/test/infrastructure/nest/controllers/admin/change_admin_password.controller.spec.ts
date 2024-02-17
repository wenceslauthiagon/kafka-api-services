import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { getMoment, defaultLogger as logger } from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  AdminVerificationCodeInvalidException,
  AdminTokenExpirationTimeInvalidException,
} from '@zro/admin/application';
import { AppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import {
  AdminDatabaseRepository,
  AdminModel,
  ChangeAdminPasswordMicroserviceController,
  ChangeAdminPasswordRequestDto,
} from '@zro/admin/infrastructure';
import { AdminFactory } from '@zro/test/admin/config';

describe('ChangeAdminPasswordMicroserviceController', () => {
  let module: TestingModule;
  let controller: ChangeAdminPasswordMicroserviceController;
  let adminRepository: AdminRepository;
  const token = 'test';

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<ChangeAdminPasswordMicroserviceController>(
      ChangeAdminPasswordMicroserviceController,
    );
    adminRepository = new AdminDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('ChangeAdminPassword', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to change admin password successfully', async () => {
        const { id, password } = await AdminFactory.create<AdminModel>(
          AdminModel.name,
          {
            tokenAttempt: 3,
            tokenExpirationTime: getMoment().add(1, 'day').toDate(),
          },
        );

        const message: ChangeAdminPasswordRequestDto = {
          id,
          password,
          confirmPassword: password,
          verificationCode: token,
        };

        const result = await controller.execute(
          adminRepository,
          logger,
          message,
        );

        expect(result).toBeUndefined();
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to change admin password with wrong token', async () => {
        const { id, password } = await AdminFactory.create<AdminModel>(
          AdminModel.name,
          {
            tokenAttempt: 3,
            tokenExpirationTime: getMoment().add(1, 'day').toDate(),
          },
        );

        const message: ChangeAdminPasswordRequestDto = {
          id,
          password,
          confirmPassword: password,
          verificationCode: faker.datatype.number(654321).toString(),
        };

        const testScript = () =>
          controller.execute(adminRepository, logger, message);

        await expect(testScript).rejects.toThrow(
          AdminVerificationCodeInvalidException,
        );
      });

      it('TC0003 - Should not be able to change admin password with invalid token', async () => {
        const { id, password } = await AdminFactory.create<AdminModel>(
          AdminModel.name,
          { tokenExpirationTime: new Date('01/01/2000') },
        );

        const message: ChangeAdminPasswordRequestDto = {
          id,
          password,
          confirmPassword: password,
          verificationCode: faker.datatype.number(654321).toString(),
        };

        const testScript = () =>
          controller.execute(adminRepository, logger, message);

        await expect(testScript).rejects.toThrow(
          AdminTokenExpirationTimeInvalidException,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
