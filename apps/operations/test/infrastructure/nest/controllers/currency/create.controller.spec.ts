import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import {
  CurrencyRepository,
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
} from '@zro/operations/domain';
import {
  CreateCurrencyMicroserviceController,
  CurrencyDatabaseRepository,
  CurrencyModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CreateCurrencyRequest } from '@zro/operations/interface';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('CreateCurrencyMicroserviceController', () => {
  let module: TestingModule;
  let controller: CreateCurrencyMicroserviceController;
  let currencyRepository: CurrencyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<CreateCurrencyMicroserviceController>(
      CreateCurrencyMicroserviceController,
    );
    currencyRepository = new CurrencyDatabaseRepository();
  });

  describe('CreateCurrency', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create currency successfully', async () => {
        const title = faker.finance.currencyName();
        const symbol = faker.datatype.string(10);
        const tag = faker.random.alpha({ count: 5, casing: 'upper' });
        const decimal = faker.datatype.number({ min: 1, max: 8 });
        const type = CurrencyType.FIAT;

        const message: CreateCurrencyRequest = {
          title,
          symbol,
          tag,
          decimal,
          type,
        };

        const result = await controller.execute(
          currencyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.title).toBe(title);
        expect(result.value.symbol).toBe(symbol);
        expect(result.value.tag).toBe(tag);
        expect(result.value.decimal).toBe(decimal);
        expect(result.value.symbolAlign).toBe(CurrencySymbolAlign.LEFT);
        expect(result.value.state).toBe(CurrencyState.ACTIVE);
      });

      it('TC0002 - Should not create a existing currency', async () => {
        const currency = await CurrencyFactory.create<CurrencyModel>(
          CurrencyModel.name,
        );
        const { title, symbol, tag, decimal, type } = currency;

        const message: CreateCurrencyRequest = {
          title,
          symbol,
          tag,
          decimal,
          type,
        };

        const result = await controller.execute(
          currencyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value).toMatchObject(currency.toDomain());
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
