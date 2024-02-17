import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { createMock } from 'ts-auto-mock';
import {
  AdminBankingTedRepository,
  AdminBankingTedState,
} from '@zro/banking/domain';
import {
  GetAdminBankingTedByIdMicroserviceController as Controller,
  AdminBankingTedDatabaseRepository,
  AdminBankingTedModel,
} from '@zro/banking/infrastructure';
import { AdminBankingTedFactory } from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';
import { GetAdminBankingTedByIdRequest } from '@zro/banking/interface';

describe('GetAdminBankingTedByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let adminBankingTedRepository: AdminBankingTedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    adminBankingTedRepository = new AdminBankingTedDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetAdminBankingTedById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by id successfully', async () => {
        const adminBankingTed =
          await AdminBankingTedFactory.create<AdminBankingTedModel>(
            AdminBankingTedModel.name,
          );

        const message: GetAdminBankingTedByIdRequest = {
          id: adminBankingTed.id,
        };

        const result = await controller.execute(
          adminBankingTedRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBe(AdminBankingTedState.PENDING);
        expect(result.value.createdAt).toBeDefined();
      });
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException when invalid data format', async () => {
      await AdminBankingTedFactory.create<AdminBankingTedModel>(
        AdminBankingTedModel.name,
      );
      const message: GetAdminBankingTedByIdRequest = {
        id: null,
      };

      const result = controller.execute(
        adminBankingTedRepository,
        logger,
        message,
        ctx,
      );
      await expect(result).rejects.toThrow(InvalidDataFormatException);
    });
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
