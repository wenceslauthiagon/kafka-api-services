import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { KafkaContext } from '@nestjs/microservices';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AdminRepository } from '@zro/admin/domain';
import {
  AdminNotFoundException,
  NotificationService,
} from '@zro/admin/application';
import { AppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import {
  SendForgetPasswordMicroserviceController as Controller,
  AdminDatabaseRepository,
  AdminModel,
  SendForgetPasswordRequestDto,
} from '@zro/admin/infrastructure';
import { AdminFactory } from '@zro/test/admin/config';

describe('SendForgetPasswordMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let adminRepository: AdminRepository;

  const notificationService: NotificationService =
    createMock<NotificationService>();
  const mockSendEmailCode: jest.Mock = On(notificationService).get(
    method((mock) => mock.sendEmailCode),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    adminRepository = new AdminDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('SendForgetPassword', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to send a forget admin email password successfully', async () => {
        const { id, email } = await AdminFactory.create<AdminModel>(
          AdminModel.name,
        );

        const message: SendForgetPasswordRequestDto = {
          email,
        };

        const result = await controller.execute(
          adminRepository,
          notificationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not be able to send forget admin password email when email is not found', async () => {
        const message: SendForgetPasswordRequestDto = {
          email: faker.internet.email(),
        };

        const testScript = () =>
          controller.execute(
            adminRepository,
            notificationService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(AdminNotFoundException);
        expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
