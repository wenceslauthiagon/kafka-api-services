import { Test, TestingModule } from '@nestjs/testing';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { createMock } from 'ts-auto-mock';
import { AdminBankingTedRepository } from '@zro/banking/domain';
import {
  GetAllAdminBankingTedRequest,
  GetAllAdminBankingTedRequestSort,
} from '@zro/banking/interface';
import {
  AdminBankingTedModel,
  GetAllAdminBankingTedMicroserviceController as Controller,
  AdminBankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { AdminBankingTedFactory } from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllAdminBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let repository: AdminBankingTedRepository;
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    repository = new AdminBankingTedDatabaseRepository();
  });

  describe('GetAllAdminBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        await AdminBankingTedFactory.createMany<AdminBankingTedModel>(
          AdminBankingTedModel.name,
          3,
        );

        const pagination = new PaginationEntity();

        const message: GetAllAdminBankingTedRequest = {
          ...pagination,
          sort: GetAllAdminBankingTedRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          repository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBe(pagination.page);
        expect(result.value.pageSize).toBe(pagination.pageSize);
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.sourceId).toBeDefined();
          expect(res.destinationId).toBeDefined();
          expect(res.state).toBeDefined();
          expect(res.value).toBeDefined();
          expect(res.transactionId).toBeDefined();
          expect(res.description).toBeDefined();
          expect(res.createdByAdminId).toBeDefined();
          expect(res.updatedByAdminId).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
