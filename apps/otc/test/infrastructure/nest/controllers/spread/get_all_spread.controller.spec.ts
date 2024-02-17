import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';

import { PaginationEntity, defaultLogger as logger } from '@zro/common';
import { SpreadRepository } from '@zro/otc/domain';
import {
  GetAllSpreadMicroserviceController as Controller,
  SpreadDatabaseRepository,
  SpreadModel,
} from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import {
  GetAllSpreadRequest,
  GetAllSpreadRequestSort,
} from '@zro/otc/interface';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllSpreadMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let spreadRepository: SpreadRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    spreadRepository = new SpreadDatabaseRepository();
  });

  describe('GetAllSpread', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get spread successfully', async () => {
        await SpreadFactory.create<SpreadModel>(SpreadModel.name);

        const pagination = new PaginationEntity();

        const message: GetAllSpreadRequest = {
          order: pagination.order,
          page: pagination.page,
          pageSize: pagination.pageSize,
          sort: pagination.sort,
        };

        const result = await controller.execute(
          spreadRepository,
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
          expect(res.id).toBeDefined();
          expect(res.sell).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.buy).toBeDefined();
          expect(res.currencyId).toBeDefined();
          expect(res.currencySymbol).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get spread successfully with pagination sort', async () => {
        await SpreadFactory.create<SpreadModel>(SpreadModel.name);

        const message: GetAllSpreadRequest = {
          sort: GetAllSpreadRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          spreadRepository,
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
          expect(res.id).toBeDefined();
          expect(res.sell).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.buy).toBeDefined();
          expect(res.currencyId).toBeDefined();
          expect(res.currencySymbol).toBeDefined();
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
