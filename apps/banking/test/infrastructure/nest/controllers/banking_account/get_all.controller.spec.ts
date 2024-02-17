import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { BankingContactRepository } from '@zro/banking/domain';
import { UserEntity } from '@zro/users/domain';
import {
  GetAllBankingContactRequest,
  GetAllBankingContactRequestSort,
} from '@zro/banking/interface';
import {
  BankingContactModel,
  GetAllBankingContactMicroserviceController as Controller,
  BankingContactDatabaseRepository,
  BankingAccountContactModel,
} from '@zro/banking/infrastructure';
import {
  BankingAccountContactFactory,
  BankingContactFactory,
} from '@zro/test/banking/config';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';

describe('GetAllBankingContactMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankingContactRepository: BankingContactRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankingContactRepository = new BankingContactDatabaseRepository();
  });

  describe('GetAllBankingContact', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bankingContacts successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        await BankingContactFactory.createMany<BankingContactModel>(
          BankingContactModel.name,
          1,
          { userId: user.id },
        );

        const pagination = new PaginationEntity();

        const message: GetAllBankingContactRequest = {
          ...pagination,
          sort: GetAllBankingContactRequestSort.CREATED_AT,
          userId: user.id,
        };

        const result = await controller.execute(
          bankingContactRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.page).toBe(pagination.page);
        expect(result.value.pageSize).toBe(pagination.pageSize);
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        expect(result.value.data.length).toBeGreaterThan(0);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.userId).toEqual(user.id);
          expect(res.id).toBeDefined();
          expect(res.name).toBeDefined();
          expect(res.document).toBeDefined();
          expect(res.documentType).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get bankingContacts with accounts', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const bankingContact =
          await BankingContactFactory.create<BankingContactModel>(
            BankingContactModel.name,
            { userId: user.id },
          );
        await BankingAccountContactFactory.createMany<BankingAccountContactModel>(
          BankingAccountContactModel.name,
          3,
          { bankingContactId: bankingContact.id },
        );

        const pagination = new PaginationEntity();

        const message: GetAllBankingContactRequest = {
          ...pagination,
          sort: GetAllBankingContactRequestSort.CREATED_AT,
          userId: user.id,
        };

        const result = await controller.execute(
          bankingContactRepository,
          logger,
          message,
          ctx,
        );

        const countAccountContacts = result.value.data.reduce(
          (prev, current) => {
            return prev + current.accounts.length;
          },
          0,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.page).toBe(pagination.page);
        expect(result.value.pageSize).toBe(pagination.pageSize);
        expect(result.value.total).toBeDefined();
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        expect(result.value.data.length).toBeGreaterThan(0);
        expect(countAccountContacts).toBeGreaterThan(0);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.userId).toEqual(user.id);
          expect(res.id).toBeDefined();
          expect(res.name).toBeDefined();
          expect(res.document).toBeDefined();
          expect(res.documentType).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0003 - Should get bankingContacts successfully with pagination sort', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        await BankingContactFactory.createMany<BankingContactModel>(
          BankingContactModel.name,
          3,
        );

        const message: GetAllBankingContactRequest = {
          userId: user.id,
          sort: GetAllBankingContactRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          bankingContactRepository,
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
          expect(res.name).toBeDefined();
          expect(res.document).toBeDefined();
          expect(res.documentType).toBeDefined();
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
