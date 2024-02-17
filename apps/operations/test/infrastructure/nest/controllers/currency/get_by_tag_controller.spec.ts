import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { CurrencyRepository } from '@zro/operations/domain';
import {
  CurrencyModel,
  GetCurrencyByTagMicroserviceController as Controller,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';
import { CurrencyNotFoundException } from '@zro/operations/application';
import { KafkaContext } from '@nestjs/microservices';
import { GetCurrencyByTagRequest } from '@zro/operations/interface';

describe('GetCurrencyByTagMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let currencyRepository: CurrencyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    currencyRepository = new CurrencyDatabaseRepository();
  });

  describe('GetCurrencyByTag', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get currency by tag successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyModel>(
          CurrencyModel.name,
        );

        const message: GetCurrencyByTagRequest = {
          tag: currency.tag,
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
        expect(result.value.tag).toBe(currency.tag);
      });

      it('TC0002 - Should not get currency with incorrect tag', async () => {
        const tag = uuidV4();

        const message: GetCurrencyByTagRequest = {
          tag,
        };

        const testScript = () =>
          controller.execute(currencyRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
