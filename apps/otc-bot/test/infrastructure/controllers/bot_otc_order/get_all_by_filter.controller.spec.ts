import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, PaginationOrder } from '@zro/common';
import {
  BotOtcOrderRepository,
  BotOtcOrderRequestSort,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import { CryptoRemittanceStatus, OrderType } from '@zro/otc/domain';
import { GetAllBotOtcOrdersByFilterRequest } from '@zro/otc-bot/interface';
import { AppModule } from '@zro/otc-bot/infrastructure/nest/modules/app.module';
import {
  BotOtcOrderDatabaseRepository,
  BotOtcOrderModel,
  GetAllBotOtcOrdersByFilterMicroserviceController as Controller,
} from '@zro/otc-bot/infrastructure';
import { BotOtcOrderFactory } from '@zro/test/otc-bot/config';

describe('GetAllBotOtcOrdersByFilterMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let botOtcOrderRemittanceRepository: BotOtcOrderRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);

    botOtcOrderRemittanceRepository = new BotOtcOrderDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Get all bot otc orders by filter.', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get all bot otc orders with pagination and filter successfully.', async () => {
        BotOtcOrderFactory.create<BotOtcOrderModel>(BotOtcOrderModel.name, {
          state: BotOtcOrderState.COMPLETED,
          type: OrderType.LIMIT,
          sellProviderName: 'B2C2',
          buyProviderName: 'B2C2',
          sellStatus: CryptoRemittanceStatus.FILLED,
        });

        const message: GetAllBotOtcOrdersByFilterRequest = {
          sort: BotOtcOrderRequestSort.CREATED_AT,
          page: 1,
          pageSize: faker.datatype.number({ min: 1, max: 99 }),
          order: PaginationOrder.DESC,
          state: BotOtcOrderState.COMPLETED,
          amountStart: 1,
          amountEnd: 20000000,
          type: OrderType.LIMIT,
          sellStatus: CryptoRemittanceStatus.FILLED,
          sellProviderName: 'B2C2',
          sellExecutedPriceStart: 1,
          sellExecutedPriceEnd: 20000000,
          sellExecutedAmountStart: 1,
          sellExecutedAmountEnd: 20000000,
          buyProviderName: 'B2C2',
          buyExecutedPriceStart: 1,
          buyExecutedPriceEnd: 20000000,
          buyExecutedAmountStart: 1,
          buyExecutedAmountEnd: 20000000,
        };

        const result = await controller.execute(
          botOtcOrderRemittanceRepository,
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
          expect(res.botOtc).toBeDefined();
          expect(res.state).toBeDefined();
          expect(res.baseCurrency).toBeDefined();
          expect(res.quoteCurrency).toBeDefined();
          expect(res.market).toBeDefined();
          expect(res.amount).toBeDefined();
          expect(res.type).toBeDefined();
          expect(res.sellStatus).toBeDefined();
          expect(res.sellPrice).toBeDefined();
          expect(res.sellStopPrice).toBeDefined();
          expect(res.sellValidUntil).toBeDefined();
          expect(res.sellProvider).toBeDefined();
          expect(res.sellProviderOrderId).toBeDefined();
          expect(res.sellProviderName).toBeDefined();
          expect(res.sellExecutedPrice).toBeDefined();
          expect(res.sellExecutedAmount).toBeDefined();
          expect(res.sellFee).toBeDefined();
          expect(res.buyProvider).toBeDefined();
          expect(res.buyProviderOrderId).toBeDefined();
          expect(res.buyProviderName).toBeDefined();
          expect(res.buyExecutedPrice).toBeDefined();
          expect(res.buyExecutedAmount).toBeDefined();
          expect(res.buyPriceSignificantDigits).toBeDefined();
          expect(res.buyFee).toBeDefined();
          expect(res.sellOrder).toBeDefined();
          expect(res.buyOrder).toBeDefined();
          expect(res.buyRemittanceId).toBeUndefined();
          expect(res.buyBankQuote).toBeUndefined();
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
