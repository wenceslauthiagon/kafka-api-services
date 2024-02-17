import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PaginationEntity, PaginationOrder } from '@zro/common';
import { ExchangeContractRepository } from '@zro/otc/domain';
import {
  ExchangeContractModel,
  GetAllExchangeContractMicroserviceController as Controller,
  ExchangeContractDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeContractFactory } from '@zro/test/otc/config';
import {
  GetAllExchangeContractRequest,
  GetAllExchangeContractRequestSort,
} from '@zro/otc/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetAllExchangeContractMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let exchangeContractRepository: ExchangeContractRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    exchangeContractRepository = new ExchangeContractDatabaseRepository();
  });

  describe('GetAllExchangeContract', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get exchange contracts successfully', async () => {
        await ExchangeContractFactory.createMany<ExchangeContractModel>(
          ExchangeContractModel.name,
          5,
        );

        const pagination = new PaginationEntity();

        const exchange = new GetAllExchangeContractRequest({
          ...pagination,
          sort: GetAllExchangeContractRequestSort.CREATED_AT,
        });

        const message: GetAllExchangeContractRequest = {
          sort: exchange.sort,
          search: exchange.search,
          vetQuote: exchange.vetQuote,
          contractQuote: exchange.contractQuote,
          totalAmount: exchange.totalAmount,
          createdAt: exchange.createdAt,
        };

        const result = await controller.execute(
          exchangeContractRepository,
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
          expect(res.contractNumber).toBeDefined();
          expect(res.vetQuote).toBeDefined();
          expect(res.contractQuote).toBeDefined();
          expect(res.totalAmount).toBeDefined();
          expect(res.fileId).toBeDefined();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0002 - Should get exchange contracts successfully with nullable file id', async () => {
        await ExchangeContractFactory.createMany<ExchangeContractModel>(
          ExchangeContractModel.name,
          5,
          {
            fileId: null,
          },
        );

        const pagination = new PaginationEntity({
          pageSize: 5,
          sort: GetAllExchangeContractRequestSort.CREATED_AT,
          order: PaginationOrder.DESC,
        });

        const exchange = new GetAllExchangeContractRequest({
          ...pagination,
          sort: GetAllExchangeContractRequestSort.CREATED_AT,
        });

        const message: GetAllExchangeContractRequest = {
          order: exchange.order,
          page: exchange.page,
          pageSize: exchange.pageSize,
          sort: exchange.sort,
          search: exchange.search,
          vetQuote: exchange.vetQuote,
          contractQuote: exchange.contractQuote,
          totalAmount: exchange.totalAmount,
          createdAt: exchange.createdAt,
        };

        const result = await controller.execute(
          exchangeContractRepository,
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
          expect(res.contractNumber).toBeDefined();
          expect(res.vetQuote).toBeDefined();
          expect(res.contractQuote).toBeDefined();
          expect(res.totalAmount).toBeDefined();
          expect(res.fileId).toBeNull();
          expect(res.createdAt).toBeDefined();
        });
      });

      it('TC0003 - Should get exchange contracts successfully with pagination sort', async () => {
        await ExchangeContractFactory.createMany<ExchangeContractModel>(
          ExchangeContractModel.name,
          5,
        );

        const message: GetAllExchangeContractRequest = {
          sort: GetAllExchangeContractRequestSort.CREATED_AT,
        };

        const result = await controller.execute(
          exchangeContractRepository,
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
          expect(res.contractNumber).toBeDefined();
          expect(res.vetQuote).toBeDefined();
          expect(res.contractQuote).toBeDefined();
          expect(res.totalAmount).toBeDefined();
          expect(res.fileId).toBeDefined();
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
