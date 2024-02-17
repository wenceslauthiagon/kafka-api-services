import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { BankTedRepository } from '@zro/banking/domain';
import {
  BankTedModel,
  GetAllBankTedMicroserviceController as Controller,
  BankTedDatabaseRepository,
} from '@zro/banking/infrastructure';
import { AppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import {
  GetAllBankTedRequest,
  GetAllBankTedRequestSort,
} from '@zro/banking/interface';
import { BankTedFactory } from '@zro/test/banking/config';

describe('GetAllBankTedMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let bankTedRepository: BankTedRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    bankTedRepository = new BankTedDatabaseRepository();
  });

  beforeEach(async () => BankTedModel.truncate());

  describe('GetAllBankTed', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get bankTeds successfully', async () => {
        await BankTedModel.truncate();
        await BankTedFactory.createMany<BankTedModel>(BankTedModel.name, 3);

        const pagination = new PaginationEntity();

        const message: GetAllBankTedRequest = {
          ...pagination,
          sort: GetAllBankTedRequestSort.ID,
        };

        const result = await controller.execute(
          bankTedRepository,
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
        expect(result.value.total).toBe(3);
        expect(result.value.pageTotal).toBe(
          Math.ceil(result.value.total / result.value.pageSize),
        );
        result.value.data.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.code).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get bankTeds successfully with pagination sort', async () => {
        await BankTedFactory.createMany<BankTedModel>(BankTedModel.name, 3);

        const message: GetAllBankTedRequest = {
          sort: GetAllBankTedRequestSort.CODE,
        };

        const result = await controller.execute(
          bankTedRepository,
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
          expect(res.code).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0003 - Should get bankTeds successfully with active', async () => {
        const active = false;
        await BankTedFactory.createMany<BankTedModel>(BankTedModel.name, 2, {
          active,
        });

        const message: GetAllBankTedRequest = {
          active,
        };

        const result = await controller.execute(
          bankTedRepository,
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
          expect(res.code).toBeDefined();
          expect(res.active).toBe(active);
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0004 - Should get bankTeds successfully with code', async () => {
        const bankTed = await BankTedFactory.create<BankTedModel>(
          BankTedModel.name,
        );

        const message: GetAllBankTedRequest = {
          search: bankTed.code,
        };

        const result = await controller.execute(
          bankTedRepository,
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
          expect(res.id).toBe(bankTed.id);
          expect(res.ispb).toBe(bankTed.ispb);
          expect(res.code).toBe(bankTed.code);
          expect(res.active).toBe(bankTed.active);
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0005 - Should not get bankTeds with different search', async () => {
        await BankTedFactory.create<BankTedModel>(BankTedModel.name);

        const message: GetAllBankTedRequest = {
          search: uuidV4(),
        };

        const result = await controller.execute(
          bankTedRepository,
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

      it('TC0006 - Should not get bankTeds with different active', async () => {
        const active = false;
        await BankTedFactory.create<BankTedModel>(BankTedModel.name, {
          active,
        });

        const message: GetAllBankTedRequest = {
          active: !active,
        };

        const result = await controller.execute(
          bankTedRepository,
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
