import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  GetAdminByEmailMicroserviceController,
  AdminDatabaseRepository,
  AdminModel,
  GetAdminByEmailRequestDto,
} from '@zro/admin/infrastructure';
import { AppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AdminFactory } from '@zro/test/admin/config';

describe('AdminController', () => {
  let module: TestingModule;
  let controller: GetAdminByEmailMicroserviceController;
  let adminRepository: AdminRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetAdminByEmailMicroserviceController>(
      GetAdminByEmailMicroserviceController,
    );
    adminRepository = new AdminDatabaseRepository();
  });

  describe('GetAdminByEmail', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const { email } = await AdminFactory.create<AdminModel>(
          AdminModel.name,
        );

        const message: GetAdminByEmailRequestDto = {
          email,
        };

        const result = await controller.execute(
          adminRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.email).toBe(email);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
