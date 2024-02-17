import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
  KafkaService,
} from '@zro/common';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  RejectExchangeQuotationNestObserver as Observer,
  ExchangeQuotationDatabaseRepository,
  UtilServiceKafka,
  ExchangeQuotationModel,
} from '@zro/otc/infrastructure';
import { HandleRejectExchangeQuotationEventRequest } from '@zro/otc/interface';
import {
  ExchangeQuotationRepository,
  ExchangeQuotationState,
} from '@zro/otc/domain';
import { ExchangeQuotationGateway } from '@zro/otc/application';
import { ExchangeQuotationFactory } from '@zro/test/otc/config';
import { FeatureSettingFactory } from '@zro/test/utils/config';
import { KafkaContext } from '@nestjs/microservices';
import {
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';

describe('RejectExchangeQuotationNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let exchangeQuotationRepository: ExchangeQuotationRepository;

  const utilService: UtilServiceKafka = createMock<UtilServiceKafka>();
  const mockGetFeatureSettingByName: jest.Mock = On(utilService).get(
    method((mock) => mock.getFeatureSettingByName),
  );

  const pspGateway: ExchangeQuotationGateway =
    createMock<ExchangeQuotationGateway>();
  const mockRejectGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.rejectExchangeQuotation),
  );

  const kafkaService: KafkaService = createMock<KafkaService>();
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    observer = module.get<Observer>(Observer);
    exchangeQuotationRepository = new ExchangeQuotationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should reject an exchange quotation successfully.', async () => {
      const exchangeQuotation =
        await ExchangeQuotationFactory.create<ExchangeQuotationModel>(
          ExchangeQuotationModel.name,
          { state: ExchangeQuotationState.PENDING },
        );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.DEACTIVE,
          },
        );

      const message: HandleRejectExchangeQuotationEventRequest = {
        name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
      };

      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);

      const result =
        await observer.handleRejectExchangeQuotationEventViaTopazio(
          message,
          pspGateway,
          exchangeQuotationRepository,
          utilService,
          logger,
          ctx,
        );

      const exchangeQuotationModified = await ExchangeQuotationModel.findOne({
        where: { id: exchangeQuotation.id },
      });

      expect(result).toBeUndefined();
      expect(exchangeQuotationModified.state).toBe(
        ExchangeQuotationState.REJECTED,
      );
      expect(mockRejectGateway).toHaveBeenCalled();
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException if missing params.', async () => {
      const message: HandleRejectExchangeQuotationEventRequest = {
        name: null,
      };

      const testScript = () =>
        observer.handleRejectExchangeQuotationEventViaTopazio(
          message,
          pspGateway,
          exchangeQuotationRepository,
          utilService,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockRejectGateway).toHaveBeenCalledTimes(0);
      expect(mockGetFeatureSettingByName).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
