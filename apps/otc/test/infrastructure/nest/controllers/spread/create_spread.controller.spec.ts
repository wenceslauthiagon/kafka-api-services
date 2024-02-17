import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { SpreadRepository } from '@zro/otc/domain';
import {
  CreateSpreadMicroserviceController as Controller,
  SpreadDatabaseRepository,
  SpreadModel,
  OperationServiceKafka,
} from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import {
  CreateSpreadRequest,
  SpreadEventEmitterControllerInterface,
  SpreadEventType,
} from '@zro/otc/interface';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateSpreadMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let spreadRepository: SpreadRepository;

  const eventEmitter: SpreadEventEmitterControllerInterface =
    createMock<SpreadEventEmitterControllerInterface>();
  const mockEmitSpreadEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitSpreadEvent),
  );

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );
  const mockCreateCurrencyOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createCurrency));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    spreadRepository = new SpreadDatabaseRepository();
  });

  beforeEach(jest.resetAllMocks);

  describe('CreateSpread', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create spread successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        mockGetCurrencyOperationService.mockResolvedValue(null);
        mockCreateCurrencyOperationService.mockResolvedValue(currency);

        const currencySymbol = currency.symbol;
        const items = [
          {
            buy: faker.datatype.float(2),
            sell: faker.datatype.float(2),
            amount: faker.datatype.float(2),
          },
        ];

        const message: CreateSpreadRequest = {
          items,
          currencySymbol,
        };

        const result = await controller.execute(
          spreadRepository,
          eventEmitter,
          operationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res.id).toBeDefined();
          expect(res.sell).toBe(items[0].sell);
          expect(res.amount).toBe(items[0].amount);
          expect(res.buy).toBe(items[0].buy);
          expect(res.currencyId).toBeDefined();
          expect(res.currencySymbol).toBe(currencySymbol);
          expect(res.createdAt).toBeDefined();
        });
        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
        expect(mockCreateCurrencyOperationService).toHaveBeenCalledTimes(1);
        expect(mockEmitSpreadEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitSpreadEvent.mock.calls[0][0]).toBe(
          SpreadEventType.CREATED,
        );
      });

      it('TC0002 - Should not create a new provider and currencies', async () => {
        const spread = await SpreadFactory.create<SpreadModel>(
          SpreadModel.name,
        );

        mockGetCurrencyOperationService.mockImplementation((symbol) =>
          CurrencyFactory.create<CurrencyEntity>(CurrencyEntity.name, {
            symbol,
          }),
        );

        const { currencySymbol, buy, sell, amount } = spread;
        const items = [{ buy, sell, amount }];

        const message: CreateSpreadRequest = {
          items,
          currencySymbol,
        };

        const result = await controller.execute(
          spreadRepository,
          eventEmitter,
          operationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res.id).toBeDefined();
          expect(res.sell).toBe(sell);
          expect(res.amount).toBe(amount);
          expect(res.buy).toBe(buy);
          expect(res.currencyId).toBeDefined();
          expect(res.currencySymbol).toBe(currencySymbol);
          expect(res.createdAt).toBeDefined();
        });
        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(1);
        expect(mockCreateCurrencyOperationService).toHaveBeenCalledTimes(0);
        expect(mockEmitSpreadEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitSpreadEvent.mock.calls[0][0]).toBe(
          SpreadEventType.CREATED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
