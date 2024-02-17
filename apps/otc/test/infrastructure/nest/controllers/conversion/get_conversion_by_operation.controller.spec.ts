import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { ConversionRepository } from '@zro/otc/domain';
import {
  ConversionModel,
  GetConversionByOperationMicroserviceController as Controller,
  ConversionDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { GetConversionByOperationRequest } from '@zro/otc/interface';
import { ConversionFactory } from '@zro/test/otc/config';
import { createMock } from 'ts-auto-mock';

describe('GetConversionByOperationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let conversionRepository: ConversionRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<Controller>(Controller);
    conversionRepository = new ConversionDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetConversionByOperation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get conversion successfully', async () => {
        const conversion = await ConversionFactory.create<ConversionModel>(
          ConversionModel.name,
        );

        const { operationId } = conversion;

        const message: GetConversionByOperationRequest = {
          operationId,
        };

        const result = await controller.execute(
          conversionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBe(operationId);
        expect(result.value.quotationId).toBeDefined();
        expect(result.value.currencyId).toBeDefined();
        expect(result.value.usdQuote).toBeDefined();
        expect(result.value.usdAmount).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
