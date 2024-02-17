import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
  PrometheusService,
} from '@zro/common';
import { CurrencyEntity } from '@zro/operations/domain';
import { StreamQuotationEntity } from '@zro/quotations/domain';
import {
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';
import {
  ExchangeQuotationEntity,
  ExchangeQuotationRepository,
  RemittanceExchangeQuotationRepository,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import { ExchangeQuotationGateway } from '@zro/otc/application';
import {
  CreateAndAcceptExchangeQuotationNestObserver as Observer,
  ExchangeQuotationDatabaseRepository,
  OperationServiceKafka,
  RemittanceDatabaseRepository,
  RemittanceModel,
  UtilServiceKafka,
  QuotationServiceKafka,
  RemittanceExchangeQuotationDatabaseRepository,
} from '@zro/otc/infrastructure';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  ExchangeQuotationFactory,
  RemittanceFactory,
} from '@zro/test/otc/config';
import { CurrencyFactory } from '@zro/test/operations/config';
import { FeatureSettingFactory } from '@zro/test/utils/config';
import { StreamQuotationFactory } from '@zro/test/quotations/config';
import * as MockTestCreateExchangeQuotation from '@zro/test/otc/config/mocks/create_exchange_quotation.mock';
import * as MockTestAcceptExchangeQuotation from '@zro/test/otc/config/mocks/accept_exchange_quotation.mock';
import { HandleCreateAndAcceptExchangeQuotationEventRequest } from '@zro/otc/interface';

describe('CreateAndAcceptExchangeQuotationNestObserver', () => {
  let module: TestingModule;
  let observer: Observer;
  let exchangeQuotationRepository: ExchangeQuotationRepository;
  let remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository;
  let remittanceRepository: RemittanceRepository;

  const currencyTag = 'USD';

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyByTag: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyByTag),
  );

  const utilService: UtilServiceKafka = createMock<UtilServiceKafka>();
  const mockGetFeatureSettingByName: jest.Mock = On(utilService).get(
    method((mock) => mock.getFeatureSettingByName),
  );

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetStreamQuotation: jest.Mock = On(quotationService).get(
    method((mock) => mock.getStreamQuotationByBaseCurrency),
  );

  const pspGateway: ExchangeQuotationGateway =
    createMock<ExchangeQuotationGateway>();
  const mockCreateGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.createExchangeQuotation),
  );
  const mockAcceptGateway: jest.Mock = On(pspGateway).get(
    method((mock) => mock.acceptExchangeQuotation),
  );

  const prometheusService: PrometheusService = createMock<PrometheusService>();
  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrometheusService)
      .useValue(prometheusService)
      .compile();

    observer = module.get<Observer>(Observer);
    exchangeQuotationRepository = new ExchangeQuotationDatabaseRepository();
    remittanceExchangeQuotationRepository =
      new RemittanceExchangeQuotationDatabaseRepository();
    remittanceRepository = new RemittanceDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create and accept a new exchange quotation successfully.', async () => {
      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.WAITING },
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      await ExchangeQuotationFactory.create<ExchangeQuotationEntity>(
        ExchangeQuotationEntity.name,
      );

      const featureSetting =
        await FeatureSettingFactory.create<FeatureSettingEntity>(
          FeatureSettingEntity.name,
          {
            name: FeatureSettingName.CREATE_EXCHANGE_QUOTATION,
            state: FeatureSettingState.ACTIVE,
          },
        );

      const streamQuotation =
        await StreamQuotationFactory.create<StreamQuotationEntity>(
          StreamQuotationEntity.name,
        );

      const message: HandleCreateAndAcceptExchangeQuotationEventRequest = {
        remittanceIds: [remittance.id],
        currencyTag,
        sendDate: new Date(),
        receiveDate: new Date(),
      };

      mockGetCurrencyByTag.mockResolvedValue(currency);
      mockCreateGateway.mockImplementation(
        MockTestCreateExchangeQuotation.success,
      );
      mockAcceptGateway.mockImplementation(
        MockTestAcceptExchangeQuotation.success,
      );
      mockGetFeatureSettingByName.mockResolvedValue(featureSetting);
      mockGetStreamQuotation.mockResolvedValue(streamQuotation);

      await observer.handleCreateAndAcceptExchangeQuotationEventViaTopazio(
        message,
        pspGateway,
        exchangeQuotationRepository,
        remittanceRepository,
        remittanceExchangeQuotationRepository,
        operationService,
        utilService,
        quotationService,
        logger,
        ctx,
      );

      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(1);
      expect(mockCreateGateway).toHaveBeenCalledTimes(1);
      expect(mockAcceptGateway).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw InvalidDataFormatException if missing params.', async () => {
      const message: HandleCreateAndAcceptExchangeQuotationEventRequest = {
        remittanceIds: null,
        currencyTag,
        sendDate: null,
        receiveDate: null,
      };

      const testScript = () =>
        observer.handleCreateAndAcceptExchangeQuotationEventViaTopazio(
          message,
          pspGateway,
          exchangeQuotationRepository,
          remittanceRepository,
          remittanceExchangeQuotationRepository,

          operationService,
          utilService,
          quotationService,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockGetCurrencyByTag).toHaveBeenCalledTimes(0);
      expect(mockCreateGateway).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
