import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PaginationEntity,
  PaginationOrder,
  defaultLogger as logger,
} from '@zro/common';
import { StreamPairRepository } from '@zro/quotations/domain';
import {
  StreamPairModel,
  GetAllStreamPairMicroserviceController as Controller,
  StreamPairDatabaseRepository,
} from '@zro/quotations/infrastructure';
import { AppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { StreamPairFactory } from '@zro/test/quotations/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetAllStreamPairRequest } from '@zro/quotations/interface';

describe('GetAllStreamPairMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let streamPairRepository: StreamPairRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    streamPairRepository = new StreamPairDatabaseRepository();
  });

  describe('GetAllStreamPair', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get stream pairs successfully', async () => {
        await StreamPairFactory.createMany<StreamPairModel>(
          StreamPairModel.name,
          2,
          { active: true, createdAt: new Date() },
        );
        const pagination = new PaginationEntity({
          order: PaginationOrder.DESC,
          pageSize: 2,
        });

        const message: GetAllStreamPairRequest = {
          sort: pagination.sort,
          order: pagination.order,
          page: pagination.page,
          pageSize: pagination.pageSize,
          active: true,
        };

        const result = await controller.execute(
          streamPairRepository,
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
          expect(res.active).toBeDefined();
          expect(res.baseCurrency.id).toBeDefined();
          expect(res.quoteCurrency.id).toBeDefined();
          expect(res.gatewayName).toBeDefined();
          expect(res.composedBy).toBeUndefined();
          expect(res.priority).toBeDefined();
        });
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
