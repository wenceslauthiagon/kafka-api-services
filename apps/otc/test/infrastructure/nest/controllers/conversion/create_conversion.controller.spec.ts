import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import { AppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import {
  ConversionEntity,
  ConversionRepository,
  CryptoOrderRepository,
  OrderSide,
  SystemEntity,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CreateConversionMicroserviceController as Controller,
  OperationServiceKafka,
  QuotationServiceKafka,
  UserServiceKafka,
} from '@zro/otc/infrastructure';
import {
  ConversionEventEmitterControllerInterface,
  CreateConversionRequest,
  CryptoOrderEventEmitterControllerInterface,
} from '@zro/otc/interface';
import {
  CurrencyEntity,
  CurrencyType,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import { QuotationEntity, StreamQuotationEntity } from '@zro/quotations/domain';
import { ConversionFactory, SystemFactory } from '@zro/test/otc/config';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import {
  QuotationFactory,
  StreamQuotationFactory,
} from '@zro/test/quotations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('CreateConversionMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const conversionRepository: ConversionRepository =
    createMock<ConversionRepository>();
  const mockGetByIdConversionRepository: jest.Mock = On(
    conversionRepository,
  ).get(method((mock) => mock.getById));
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

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuid: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );
  const mockGetOnboardingByUserAndStatusIsFinished: jest.Mock = On(
    userService,
  ).get(method((mock) => mock.getOnboardingByUserAndStatusIsFinished));

  const operationService: OperationServiceKafka =
    createMock<OperationServiceKafka>();
  const mockGetCurrencyOperationService: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );
  const mockCreateAndAcceptOperationService: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.createAndAcceptOperation));
  const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
    operationService,
  ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
  const mockGetLimitTypesByFilter: jest.Mock = On(operationService).get(
    method((mock) => mock.getLimitTypesByFilter),
  );

  const quotationService: QuotationServiceKafka =
    createMock<QuotationServiceKafka>();
  const mockCreateQuotationService: jest.Mock = On(quotationService).get(
    method((mock) => mock.createQuotation),
  );
  const mockGetCurrentQuotationById: jest.Mock = On(quotationService).get(
    method((mock) => mock.getCurrentQuotationById),
  );

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

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(jest.resetAllMocks);

  describe('Create Conversion', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create conversion successfully - side Buy', async () => {
        const system = await SystemFactory.create<SystemEntity>(
          SystemEntity.name,
        );

        mockGetByIdConversionRepository.mockResolvedValue(null);

        mockGetByNameSystemRepository.mockResolvedValue(system);
        mockGetLimitTypesByFilter.mockResolvedValue([]);

        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          {
            id: 2,
            symbol: 'BTC',
            decimal: 8,
            tag: 'BTC',
            type: CurrencyType.CRYPTO,
          },
        );

        const currencyUSD = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          {
            id: 3,
            symbol: 'USD',
            decimal: 2,
            tag: 'USD',
            type: CurrencyType.FIAT,
          },
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
                      { quoteCurrency: currencyUSD, baseCurrency: currencyBTC },
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
                        baseCurrency: currencyUSD,
                      },
                    ),
                  ],
                },
              ),
          },
        );

        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
        );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );

        const conversion = await ConversionFactory.create<ConversionEntity>(
          ConversionEntity.name,
        );

        const operation = conversion.operation;

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        mockGetUserByUuid.mockResolvedValue(user);
        mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(
          onboarding,
        );
        mockGetCurrencyOperationService.mockResolvedValueOnce(currencyBTC);
        mockGetCurrencyOperationService.mockResolvedValueOnce(currencyUSD);
        mockCreateAndAcceptOperationService.mockResolvedValue(operation);
        mockGetCurrentQuotationById.mockResolvedValue(quotation);
        mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);

        const message: CreateConversionRequest = {
          id: uuidV4(),
          walletId: wallet.uuid,
          quotationId: quotation.id,
          userId: user.uuid,
          systemName: system.name,
        };

        const result = await controller.execute(
          conversionRepository,
          cryptoOrderRepository,
          systemRepository,
          userService,
          operationService,
          quotationService,
          conversionEmitter,
          cryptoOrderEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
        expect(mockEmitConversionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitCryptoOrderEvent).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
        expect(
          mockGetOnboardingByUserAndStatusIsFinished,
        ).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
        expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
      });

      it('TC0002 - Should create conversion successfully - side Sell', async () => {
        const system = await SystemFactory.create<SystemEntity>(
          SystemEntity.name,
        );

        mockGetByIdConversionRepository.mockResolvedValue(null);
        mockGetByNameSystemRepository.mockResolvedValue(system);
        mockGetLimitTypesByFilter.mockResolvedValue([]);

        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          {
            id: 2,
            symbol: 'BTC',
            decimal: 8,
            tag: 'BTC',
            type: CurrencyType.CRYPTO,
          },
        );

        const currencyUSD = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
          {
            id: 3,
            symbol: 'USD',
            decimal: 2,
            tag: 'USD',
            type: CurrencyType.FIAT,
          },
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
                      { quoteCurrency: currencyUSD, baseCurrency: currencyBTC },
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
                        baseCurrency: currencyUSD,
                      },
                    ),
                  ],
                },
              ),
          },
        );

        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
        );

        const walletAccount =
          await WalletAccountFactory.create<WalletAccountEntity>(
            WalletAccountEntity.name,
            { state: WalletAccountState.ACTIVE },
          );

        const conversion = await ConversionFactory.create<ConversionEntity>(
          ConversionEntity.name,
        );

        const operation = conversion.operation;

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        mockGetUserByUuid.mockResolvedValue(user);
        mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(
          onboarding,
        );
        mockGetCurrencyOperationService.mockResolvedValueOnce(currencyBTC);
        mockGetCurrencyOperationService.mockResolvedValueOnce(currencyUSD);
        mockCreateAndAcceptOperationService.mockResolvedValue(operation);
        mockGetCurrentQuotationById.mockResolvedValue(quotation);
        mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);

        const message: CreateConversionRequest = {
          id: uuidV4(),
          walletId: wallet.uuid,
          quotationId: quotation.id,
          userId: user.uuid,
          systemName: system.name,
        };

        const result = await controller.execute(
          conversionRepository,
          cryptoOrderRepository,
          systemRepository,
          userService,
          operationService,
          quotationService,
          conversionEmitter,
          cryptoOrderEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.operationId).toBeDefined();
        expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
        expect(mockEmitConversionEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitCryptoOrderEvent).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
        expect(
          mockGetOnboardingByUserAndStatusIsFinished,
        ).toHaveBeenCalledTimes(1);
        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(2);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(1);
        expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
        expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
      });

      it('TC0003 - Should not create a new conversion if already exists', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const conversion = await ConversionFactory.create<ConversionEntity>(
          ConversionEntity.name,
          { user },
        );
        mockGetByIdConversionRepository.mockResolvedValue(conversion);

        const quotation = await QuotationFactory.create<QuotationEntity>(
          QuotationEntity.name,
        );

        const wallet = await WalletFactory.create<WalletEntity>(
          WalletEntity.name,
        );

        const system = await SystemFactory.create<SystemEntity>(
          SystemEntity.name,
        );

        const message: CreateConversionRequest = {
          id: conversion.id,
          walletId: wallet.uuid,
          quotationId: quotation.id,
          userId: user.uuid,
          systemName: system.name,
        };

        const result = await controller.execute(
          conversionRepository,
          cryptoOrderRepository,
          systemRepository,
          userService,
          operationService,
          quotationService,
          conversionEmitter,
          cryptoOrderEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(conversion.id);
        expect(result.value.operationId).toBe(conversion.operation.id);
        expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
        expect(mockEmitConversionEvent).toHaveBeenCalledTimes(0);
        expect(mockEmitCryptoOrderEvent).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
        expect(
          mockGetOnboardingByUserAndStatusIsFinished,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
        expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(0);
        expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
