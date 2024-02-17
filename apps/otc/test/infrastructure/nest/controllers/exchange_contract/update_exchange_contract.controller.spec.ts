import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { ExchangeContractRepository } from '@zro/otc/domain';
import {
  ExchangeContractDatabaseRepository,
  ExchangeContractModel,
  UpdateExchangeContractMicroserviceController as Controller,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ExchangeContractFactory } from '@zro/test/otc/config';
import { KafkaContext } from '@nestjs/microservices';
import { UpdateExchangeContractRequest } from '@zro/otc/interface';

describe('UpdateExchangeContractMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let exchangeContractRepository: ExchangeContractRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    exchangeContractRepository = new ExchangeContractDatabaseRepository();
  });

  describe('Update Exchange Contract', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should be able to upload exchange contract file successfully', async () => {
        const exchangeContract =
          await ExchangeContractFactory.create<ExchangeContractModel>(
            ExchangeContractModel.name,
          );

        const message: UpdateExchangeContractRequest = {
          id: exchangeContract.id,
          contractNumber: exchangeContract.contractNumber,
          vetQuote: exchangeContract.vetQuote,
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
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not be able to upload exchange contract file with incorrect data type', async () => {
        await ExchangeContractFactory.create<ExchangeContractModel>(
          ExchangeContractModel.name,
        );

        const message: UpdateExchangeContractRequest = {
          contractNumber: null,
          id: null,
          vetQuote: null,
        };

        const testScript = () =>
          controller.execute(exchangeContractRepository, logger, message, ctx);

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
