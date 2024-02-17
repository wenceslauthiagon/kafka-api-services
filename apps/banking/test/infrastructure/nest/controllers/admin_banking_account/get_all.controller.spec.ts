import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { AdminBankingAccountRepository } from '@zro/banking/domain';
import {
  GetAllAdminBankingAccountRequest,
  GetAllAdminBankingAccountRequestSort,
} from '@zro/banking/interface';
import {
  AdminBankingAccountModel,
  GetAllAdminBankingAccountMicroserviceController as Controller,
  AdminBankingAccountDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { AdminBankingAccountFactory } from '@zro/test/banking/config';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllAdminBankingAccountMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let repository: AdminBankingAccountRepository;
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    repository = new AdminBankingAccountDatabaseRepository();
  });

  describe('GetAllAdminBankingAccount', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        await AdminBankingAccountFactory.createMany<AdminBankingAccountModel>(
          AdminBankingAccountModel.name,
          3,
        );

        const pagination = new PaginationEntity();

        const message: GetAllAdminBankingAccountRequest = {
          ...pagination,
          sort: GetAllAdminBankingAccountRequestSort.CREATED_AT,
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
          expect(res.fullName).toBeDefined();
          expect(res.document).toBeDefined();
          expect(res.description).toBeDefined();
          expect(res.bankName).toBeDefined();
          expect(res.bankCode).toBeDefined();
          expect(res.branchNumber).toBeDefined();
          expect(res.accountNumber).toBeDefined();
          expect(res.accountType).toBeDefined();
          expect(res.accountDigit).toBeDefined();
          expect(res.enabled).toBeDefined();
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
