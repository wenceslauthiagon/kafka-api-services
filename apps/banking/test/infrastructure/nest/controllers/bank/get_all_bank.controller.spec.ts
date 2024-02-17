import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { BankRepository } from '@zro/banking/domain';
import {
  BankModel,
  GetAllBankMicroserviceController as Controller,
  BankDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { BankFactory } from '@zro/test/banking/config';
import {
  GetAllBankRequest,
  GetAllBankRequestSort,
} from '@zro/banking/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllBankMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankRepository: BankRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankRepository = new BankDatabaseRepository();
  });

  describe('GetAllBank', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get banks successfully', async () => {
        await BankFactory.createMany<BankModel>(BankModel.name, 3);

        const pagination = new PaginationEntity();

        const message: GetAllBankRequest = {
          ...pagination,
          sort: GetAllBankRequestSort.ID,
        };

        const result = await controller.execute(
          bankRepository,
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
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get banks successfully with pagination sort', async () => {
        await BankFactory.createMany<BankModel>(BankModel.name, 3);

        const message: GetAllBankRequest = {
          sort: GetAllBankRequestSort.ISPB,
        };

        const result = await controller.execute(
          bankRepository,
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
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0003 - Should get banks successfully with active', async () => {
        const active = false;
        await BankFactory.createMany<BankModel>(BankModel.name, 2, { active });

        const message: GetAllBankRequest = {
          active,
        };

        const result = await controller.execute(
          bankRepository,
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
          expect(res.ispb).toBeDefined();
          expect(res.active).toBe(active);
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0004 - Should get banks successfully with ispb', async () => {
        const bank = await BankFactory.create<BankModel>(BankModel.name);

        const message: GetAllBankRequest = {
          search: bank.ispb,
        };

        const result = await controller.execute(
          bankRepository,
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
        expect(result.value.total).toBe(1);
        expect(result.value.pageTotal).toBe(1);
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBe(bank.id);
          expect(res.ispb).toBe(bank.ispb);
          expect(res.active).toBe(bank.active);
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0005 - Should not get banks with different search', async () => {
        await BankFactory.create<BankModel>(BankModel.name);

        const message: GetAllBankRequest = {
          search: uuidV4(),
        };

        const result = await controller.execute(
          bankRepository,
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
        expect(result.value.total).toBe(0);
        expect(result.value.pageTotal).toBe(0);
        expect(result.value.data).toHaveLength(0);
      });

      it('TC0006 - Should not get banks with different active', async () => {
        const active = false;
        await BankFactory.create<BankModel>(BankModel.name, { active });

        const message: GetAllBankRequest = {
          active: !active,
        };

        const result = await controller.execute(
          bankRepository,
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
          expect(res.active).toBe(!active);
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
