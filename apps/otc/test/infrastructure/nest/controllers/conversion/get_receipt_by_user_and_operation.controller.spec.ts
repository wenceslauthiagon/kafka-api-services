import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import {
  defaultLogger as logger,
  ReceiptPortugueseTranslation,
} from '@zro/common';
import { ConversionRepository } from '@zro/otc/domain';
import {
  ConversionModel,
  GetConversionReceiptByUserAndOperationMicroserviceController as Controller,
  ConversionDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { ConversionFactory } from '@zro/test/otc/config';
import { CurrencyEntity } from '@zro/operations/domain';
import { CurrencyFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetConversionReceiptByUserAndOperationRequest } from '@zro/otc/interface';

describe('GetConversionReceiptByUserAndOperationMicroserviceController', () => {
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

  describe('GetConversionReceiptByUserAndOperation', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get conversion receipt successfully', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        const conversion = await ConversionFactory.create<ConversionModel>(
          ConversionModel.name,
          { currencyId: currency.id },
        );

        const { userUUID: userId, operationId } = conversion;

        const message: GetConversionReceiptByUserAndOperationRequest = {
          userId,
          operationId,
          currencyId: currency.id,
          currencySymbol: currency.symbol,
          currencyTag: currency.tag,
          currencyTitle: currency.title,
          currencyDecimal: currency.decimal,
        };

        const result = await controller.execute(
          conversionRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.paymentData).toBeDefined();
        expect(result.value.paymentTitle).toBe(
          ReceiptPortugueseTranslation.cov,
        );
        expect(result.value.operationId).toBe(operationId);
        expect(result.value.isScheduled).toBe(false);
        expect(result.value.activeDevolution).toBe(false);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
