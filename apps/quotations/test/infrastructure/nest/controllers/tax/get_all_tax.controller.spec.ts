import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, PaginationEntity } from '@zro/common';
import { TaxRepository } from '@zro/quotations/domain';
import {
  TaxModel,
  GetAllTaxMicroserviceController as Controller,
  TaxDatabaseRepository,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import {
  GetAllTaxRequestSort,
  GetAllTaxRequest,
} from '@zro/quotations/interface';
import { TaxFactory } from '@zro/test/quotations/config';

describe('GetAllTaxMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let taxOrderRepository: TaxRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    taxOrderRepository = new TaxDatabaseRepository();
  });

  describe('GetAllTax', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get taxes successfully', async () => {
        await TaxFactory.createMany<TaxModel>(TaxModel.name, 3);

        const pagination = new PaginationEntity();

        const tax = new GetAllTaxRequest(pagination);

        const message: GetAllTaxRequest = {
          name: tax.name,
          order: tax.order,
          page: tax.page,
          pageSize: tax.pageSize,
          sort: tax.sort,
        };

        const result = await controller.execute(
          taxOrderRepository,
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
          expect(res.formattedValue).toBeDefined();
        });
      });

      it('TC0002 - Should get taxes successfully with pagination sort', async () => {
        await TaxFactory.createMany<TaxModel>(TaxModel.name, 3);

        const message: GetAllTaxRequest = {
          sort: GetAllTaxRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          taxOrderRepository,
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
          expect(res.formattedValue).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
