import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  GetAdminByIdKafkaRequest,
  GetAdminByIdMicroserviceController,
  AdminDatabaseRepository,
  AdminModel,
} from '@zro/admin/infrastructure';
import { AppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AdminFactory } from '@zro/test/admin/config';

describe('AdminController', () => {
  let module: TestingModule;
  let controller: GetAdminByIdMicroserviceController;
  let adminRepository: AdminRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetAdminByIdMicroserviceController>(
      GetAdminByIdMicroserviceController,
    );
    adminRepository = new AdminDatabaseRepository();
  });

  describe('GetAdminById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const { id } = await AdminFactory.create<AdminModel>(AdminModel.name);

        const message: GetAdminByIdKafkaRequest = {
          key: uuidV4(),
          value: { id },
          headers: {},
        };

        const result = await controller.execute(
          adminRepository,
          logger,
          message,
        );

        expect(result).toBeDefined();
        expect(result.key).toBe(message.key);
        expect(result.headers).toMatchObject(message.headers);
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(id);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
