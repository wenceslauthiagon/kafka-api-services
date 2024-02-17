import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import {
  CashbackEntity,
  CashbackRepository,
  ConversionRepository,
  CryptoOrderRepository,
  OrderSide,
  SystemEntity,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CurrencyEntity,
  CurrencyType,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import { QuotationEntity, StreamQuotationEntity } from '@zro/quotations/domain';
import {
  CashbackEventEmitterControllerInterface,
  ConversionEventEmitterControllerInterface,
  CreateCashbackRequest,
  CryptoOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  CreateCashbackMicroserviceController as Controller,
  OperationServiceKafka,
  QuotationServiceKafka,
  UserServiceKafka,
} from '@zro/otc/infrastructure';
import {
  QuotationFactory,
  StreamQuotationFactory,
} from '@zro/test/quotations/config';
import { CashbackFactory, SystemFactory } from '@zro/test/otc/config';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateCashbackMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  //Mock Repository
  const conversionRepository: ConversionRepository =
    createMock<ConversionRepository>();
  const mockCreateConversionRepository: jest.Mock = On(
    conversionRepository,
  ).get(method((mock) => mock.create));

  const cryptoOrderRepository: CryptoOrderRepository =
    createMock<CryptoOrderRepository>();
  const mockCreateCryptoOrderRepository: jest.Mock = On(
    cryptoOrderRepository,
  ).get(method((mock) => mock.create));

  const systemRepository: SystemRepository = createMock<SystemRepository>();
  const mockGetByNameSystemRepository: jest.Mock = On(systemRepository).get(
    method((mock) => mock.getByName),
  );

  const cashbackRepository: CashbackRepository =
    createMock<CashbackRepository>();
  const mockGetByIdCashbackRepository: jest.Mock = On(cashbackRepository).get(
    method((mock) => mock.getWithConversionById),
  );
  const mockCreateCashbackRepository: jest.Mock = On(cashbackRepository).get(
    method((mock) => mock.create),
  );

  //Mock Service
  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );
  const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
  const mockCreateAndAcceptOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createAndAcceptOperation));

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockGetQuotation: jest.Mock = On(quotationService).get(
    method((mock) => mock.getQuotation),
  );
  const mockCreateQuotationService: jest.Mock = On(quotationService).get(
    method((mock) => mock.createQuotation),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuid: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );
  const mockGetOnboardingByUserAndStatusIsFinished: jest.Mock = On(
    userService,
  ).get(method((mock) => mock.getOnboardingByUserAndStatusIsFinished));

  //Mock Emitter
  const conversionEmitter: ConversionEventEmitterControllerInterface =
    createMock<ConversionEventEmitterControllerInterface>();
  const mockEmitConversionEvent: jest.Mock = On(conversionEmitter).get(
    method((mock) => mock.emitConversionEvent),
  );

  const cryptoOrderEmitter: CryptoOrderEventEmitterControllerInterface =
    createMock<CryptoOrderEventEmitterControllerInterface>();
  const mockEmitCryptoOrderEvent: jest.Mock = On(cryptoOrderEmitter).get(
    method((mock) => mock.emitCryptoOrderEvent),
  );

  const cashbackEmitter: CashbackEventEmitterControllerInterface =
    createMock<CashbackEventEmitterControllerInterface>();
  const mockEmitCashbackEvent: jest.Mock = On(cashbackEmitter).get(
    method((mock) => mock.emitCashbackEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(jest.resetAllMocks);

  describe('Create Cashback', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create cashback successfully', async () => {
        mockGetByIdCashbackRepository.mockResolvedValue(null);

        const system = await SystemFactory.create<SystemEntity>(
          SystemEntity.name,
        );
        mockGetByNameSystemRepository.mockResolvedValue(system);

        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        mockGetUserByUuid.mockResolvedValue(user);

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
        );
        mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(
          onboarding,
        );

        const quotation = await QuotationFactory.create<QuotationEntity>(
          QuotationEntity.name,
          {
            side: OrderSide.BUY,
            streamQuotation:
              await StreamQuotationFactory.create<StreamQuotationEntity>(
                StreamQuotationEntity.name,
                {
                  composedBy: [
                    await StreamQuotationFactory.create<StreamQuotationEntity>(
                      StreamQuotationEntity.name,
                      {
                        quoteCurrency:
                          await CurrencyFactory.create<CurrencyEntity>(
                            CurrencyEntity.name,
                            {
                              id: 3,
                              symbol: 'USD',
                              decimal: 2,
                              tag: 'USD',
                              type: CurrencyType.FIAT,
                            },
                          ),
                        baseCurrency:
                          await CurrencyFactory.create<CurrencyEntity>(
                            CurrencyEntity.name,
                            {
                              id: 2,
                              symbol: 'BTC',
                              decimal: 8,
                              tag: 'BTC',
                              type: CurrencyType.CRYPTO,
                            },
                          ),
                      },
                    ),
                    await StreamQuotationFactory.create<StreamQuotationEntity>(
                      StreamQuotationEntity.name,
                      {
                        quoteCurrency:
                          await CurrencyFactory.create<CurrencyEntity>(
                            CurrencyEntity.name,
                            {
                              id: 1,
                              symbol: 'BRL',
                              decimal: 2,
                              tag: 'BRL',
                              type: CurrencyType.FIAT,
                            },
                          ),
                        baseCurrency:
                          await CurrencyFactory.create<CurrencyEntity>(
                            CurrencyEntity.name,
                            {
                              id: 3,
                              symbol: 'USD',
                              decimal: 2,
                              tag: 'USD',
                              type: CurrencyType.FIAT,
                            },
                          ),
                      },
                    ),
                  ],
                },
              ),
          },
        );
        mockGetQuotation.mockResolvedValue(quotation);

        const foundCurrency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        mockGetCurrencyBySymbol.mockResolvedValue(foundCurrency);

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );
        mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);

        const amount = faker.datatype.number({ min: 1, max: 99999 });

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        const message: CreateCashbackRequest = {
          id: faker.datatype.uuid(),
          walletId: wallet.uuid,
          baseCurrencySymbol: currency.symbol,
          amountCurrencySymbol: currency.symbol,
          amount,
          userId: user.uuid,
        };

        const result = await controller.execute(
          conversionRepository,
          cryptoOrderRepository,
          systemRepository,
          cashbackRepository,
          cryptoOrderEmitter,
          conversionEmitter,
          cashbackEmitter,
          operationService,
          quotationService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.conversionId).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(mockEmitCryptoOrderEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitConversionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitCashbackEvent).toHaveBeenCalledTimes(1);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
        expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetQuotation).toHaveBeenCalledTimes(1);
        expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
        expect(
          mockGetOnboardingByUserAndStatusIsFinished,
        ).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should not create a new cashback if already exists', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const cashback = await CashbackFactory.create<CashbackEntity>(
          CashbackEntity.name,
          { user },
        );
        mockGetByIdCashbackRepository.mockResolvedValue(cashback);

        const amount = faker.datatype.number({ min: 1, max: 99999 });

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        const message: CreateCashbackRequest = {
          id: faker.datatype.uuid(),
          walletId: wallet.uuid,
          baseCurrencySymbol: currency.symbol,
          amountCurrencySymbol: currency.symbol,
          amount,
          userId: user.uuid,
        };

        const result = await controller.execute(
          conversionRepository,
          cryptoOrderRepository,
          systemRepository,
          cashbackRepository,
          cryptoOrderEmitter,
          conversionEmitter,
          cashbackEmitter,
          operationService,
          quotationService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(cashback.id);
        expect(result.value.conversionId).toBe(cashback.conversion.id);
        expect(mockEmitCryptoOrderEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitConversionEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitCashbackEvent).toHaveBeenCalledTimes(0);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetQuotation).toHaveBeenCalledTimes(0);
        expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
        expect(
          mockGetOnboardingByUserAndStatusIsFinished,
        ).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
