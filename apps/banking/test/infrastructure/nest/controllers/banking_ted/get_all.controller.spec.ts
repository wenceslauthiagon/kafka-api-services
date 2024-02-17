import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { BankingTedRepository } from '@zro/banking/domain';
import {
  BankingTedModel,
  GetAllBankingTedMicroserviceController as Controller,
  BankingTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  GetAllBankingTedRequest,
  GetAllBankingTedRequestSort,
} from '@zro/banking/interface';
import { BankingTedFactory } from '@zro/test/banking/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllBankingTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingTedRepository: BankingTedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingTedRepository = new BankingTedDatabaseRepository();
  });

  describe('GetAllBankingTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bankingTeds successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        await BankingTedFactory.createMany<BankingTedModel>(
          BankingTedModel.name,
          3,
          { user },
        );

        const pagination = new PaginationEntity();

        const message: GetAllBankingTedRequest = {
          ...pagination,
          sort: GetAllBankingTedRequestSort.CREATED_AT,
          userId: user.uuid,
        };

        const result = await controller.execute(
          bankingTedRepository,
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
          expect(res.transactionId).toBeDefined();
          expect(res.operationId).toBeDefined();
          expect(res.state).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.beneficiaryBankCode).toBeDefined();
          expect(res.beneficiaryBankName).toBeDefined();
          expect(res.beneficiaryName).toBeDefined();
          expect(res.beneficiaryType).toBeDefined();
          expect(res.beneficiaryDocument).toBeDefined();
          expect(res.beneficiaryAgency).toBeDefined();
          expect(res.beneficiaryAccount).toBeDefined();
          expect(res.beneficiaryAccountDigit).toBeDefined();
          expect(res.beneficiaryAccountType).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.confirmedAt).toBeDefined();
          expect(res.failedAt).toBeDefined();
        });
      });

      it('TC0002 - Should get bankingTeds successfully with pagination sort', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        await BankingTedFactory.createMany<BankingTedModel>(
          BankingTedModel.name,
          3,
        );

        const message: GetAllBankingTedRequest = {
          userId: user.uuid,
          sort: GetAllBankingTedRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          bankingTedRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.data).toBeDefined();
        expect(result.value.page).toBeDefined();
        expect(result.value.pageSize).toBeDefined();
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.transactionId).toBeDefined();
          expect(res.operationId).toBeDefined();
          expect(res.state).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.beneficiaryBankCode).toBeDefined();
          expect(res.beneficiaryBankName).toBeDefined();
          expect(res.beneficiaryName).toBeDefined();
          expect(res.beneficiaryType).toBeDefined();
          expect(res.beneficiaryDocument).toBeDefined();
          expect(res.beneficiaryAgency).toBeDefined();
          expect(res.beneficiaryAccount).toBeDefined();
          expect(res.beneficiaryAccountDigit).toBeDefined();
          expect(res.beneficiaryAccountType).toBeDefined();
          expect(res.createdAt).toBeDefined();
          expect(res.confirmedAt).toBeDefined();
          expect(res.failedAt).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
