import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger } from '@zro/common';
import { CurrencyRepository } from '@zro/operations/domain';
import {
  CurrencyModel,
  GetAllCurrencyMicroserviceController as Controller,
  CurrencyDatabaseRepository,
} from '@zro/operations/infrastructure';
import { GetAllCurrencyRequest } from '@zro/operations/interface';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';

describe('GetAllCurrencyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let currencyRepository: CurrencyRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    currencyRepository = new CurrencyDatabaseRepository();
  });

  describe('GetAllCurrencysByFolder', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to get currencies by filter successfully', async () => {
        const title = 'new-coin';

        await CurrencyFactory.create<CurrencyModel>(CurrencyModel.name, {
          title,
        });

        const message: GetAllCurrencyRequest = {
          title,
        };

        const result = await controller.execute(
          currencyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
      });
    });

    it('TC0002 - Should be able get an empty array with no currency was found', async () => {
      await CurrencyFactory.createMany<CurrencyModel>(CurrencyModel.name, 5);

      const message: GetAllCurrencyRequest = {
        title: `${uuidV4()}-random-title}`,
      };

      const result = await controller.execute(
        currencyRepository,
        logger,
        message,
        ctx,
      );

      expect(result.value.data.length).toBeFalsy();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
