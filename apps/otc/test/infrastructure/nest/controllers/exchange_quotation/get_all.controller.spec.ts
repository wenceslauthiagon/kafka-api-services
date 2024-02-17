import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, PaginationOrder } from '@zro/common';
import { ExchangeQuotationRepository } from '@zro/otc/domain';
import {
  GetAllExchangeQuotationMicroserviceController as Controller,
  ExchangeQuotationDatabaseRepository,
  ExchangeQuotationModel,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  GetAllExchangeQuotationRequest,
  GetAllExchangeQuotationRequestSort,
} from '@zro/otc/interface';
import { ExchangeQuotationFactory } from '@zro/test/otc/config';

describe('GetAllExchangeQuotationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let exchangeQuotationRepository: ExchangeQuotationRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    exchangeQuotationRepository = new ExchangeQuotationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get all exchange quotations.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get all exchange quotations with pagination and filter successfully.', async () => {
        await ExchangeQuotationModel.truncate();
        await ExchangeQuotationFactory.create<ExchangeQuotationModel>(
          ExchangeQuotationModel.name,
        );

        const message: GetAllExchangeQuotationRequest = {
          sort: GetAllExchangeQuotationRequestSort.CREATED_AT,
          page: 1,
          pageSize: faker.datatype.number({ min: 1, max: 99 }),
          order: PaginationOrder.DESC,
        };

        const result = await controller.execute(
          exchangeQuotationRepository,
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
          expect(res.quotation).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.amountExternalCurrency).toBeDefined();
          expect(res.quotationPspId).toBeDefined();
          expect(res.solicitationPspId).toBeDefined();
          expect(res.gatewayName).toBeDefined();
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
