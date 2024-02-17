import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { CurrencyRepository } from '@zro/operations/domain';
import {
  CurrencyModel,
  GetCurrencyByIdMicroserviceController as Controller,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';
import { GetCurrencyByIdRequest } from '@zro/operations/interface';

describe('GetCurrencyByIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let currencyRepository: CurrencyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    currencyRepository = new CurrencyDatabaseRepository();
  });

  describe('GetCurrencyById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get currency by id successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyModel>(
          CurrencyModel.name,
        );

        const message: GetCurrencyByIdRequest = {
          id: currency.id,
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
        expect(result.value.id).toBe(currency.id);
      });

      it('TC0002 - Should not get currency with incorrect id', async () => {
        const id = faker.datatype.number({ min: 9999, max: 999999999 });

        const message: GetCurrencyByIdRequest = {
          id,
        };

        const result = await controller.execute(
          currencyRepository,
          logger,
          message,
          ctx,
        );

        expect(result.value).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
