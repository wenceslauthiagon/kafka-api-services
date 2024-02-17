import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  CreateCashbackUseCase as UseCase,
  ConversionEventEmitter,
  CryptoOrderEventEmitter,
  OperationService,
  QuotationService,
  UserService,
  CashbackEventEmitter,
} from '@zro/otc/application';
import {
  CashbackEntity,
  CashbackRepository,
  ConversionRepository,
  CryptoOrderRepository,
  OrderSide,
  SystemEntity,
  SystemRepository,
} from '@zro/otc/domain';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { OnboardingEntity, UserEntity } from '@zro/users/domain';
import { QuotationEntity, StreamQuotationEntity } from '@zro/quotations/domain';
import {
  CurrencyEntity,
  CurrencyType,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import { QuotationNotFoundException } from '@zro/quotations/application';
import {
  CurrencyNotFoundException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';
import { CashbackFactory, SystemFactory } from '@zro/test/otc/config';
import {
  QuotationFactory,
  StreamQuotationFactory,
} from '@zro/test/quotations/config';
import {
  CurrencyFactory,
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';

describe('CreateCashbackUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const cryptoOrderEmitter: CryptoOrderEventEmitter =
      createMock<CryptoOrderEventEmitter>();
    const mockPendingCryptoOrder: jest.Mock = On(cryptoOrderEmitter).get(
      method((mock) => mock.pendingCryptoOrder),
    );

    const conversionEmitter: ConversionEventEmitter =
      createMock<ConversionEventEmitter>();
    const mockReadyConversion: jest.Mock = On(conversionEmitter).get(
      method((mock) => mock.readyConversion),
    );

    const cashbackEmitter: CashbackEventEmitter =
      createMock<CashbackEventEmitter>();
    const mockReadyCashback: jest.Mock = On(cashbackEmitter).get(
      method((mock) => mock.readyCashback),
    );

    return {
      cryptoOrderEmitter,
      mockPendingCryptoOrder,
      conversionEmitter,
      mockReadyConversion,
      cashbackEmitter,
      mockReadyCashback,
    };
  };

  const mockRepository = () => {
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

    return {
      conversionRepository,
      mockCreateConversionRepository,
      cryptoOrderRepository,
      mockCreateCryptoOrderRepository,
      systemRepository,
      mockGetByNameSystemRepository,
      cashbackRepository,
      mockGetByIdCashbackRepository,
      mockCreateCashbackRepository,
    };
  };

  const mockService = () => {
    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyBySymbol),
    );
    const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
    const mockCreateAndAcceptOperationService: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.createAndAcceptOperation));

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockGetQuotation: jest.Mock = On(quotationService).get(
      method((mock) => mock.getQuotation),
    );
    const mockCreateQuotationService: jest.Mock = On(quotationService).get(
      method((mock) => mock.createQuotation),
    );

    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuid: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingByUserAndStatusIsFinished: jest.Mock = On(
      userService,
    ).get(method((mock) => mock.getOnboardingByUserAndStatusIsFinished));

    return {
      operationService,
      mockGetCurrencyBySymbol,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateAndAcceptOperationService,
      quotationService,
      mockGetQuotation,
      mockCreateQuotationService,
      userService,
      mockGetUserByUuid,
      mockGetOnboardingByUserAndStatusIsFinished,
    };
  };

  const makeSut = () => {
    const cashbackOperationTransactionTag = 'CASHBACK';
    const conversionSystemName = 'CONVERSION_SYSTEM';
    const symbolCurrencyMidQuote = 'USD';

    const {
      cryptoOrderEmitter,
      mockPendingCryptoOrder,
      conversionEmitter,
      mockReadyConversion,
      cashbackEmitter,
      mockReadyCashback,
    } = mockEmitter();

    const {
      conversionRepository,
      mockCreateConversionRepository,
      cryptoOrderRepository,
      mockCreateCryptoOrderRepository,
      systemRepository,
      mockGetByNameSystemRepository,
      cashbackRepository,
      mockGetByIdCashbackRepository,
      mockCreateCashbackRepository,
    } = mockRepository();

    const {
      operationService,
      mockGetCurrencyBySymbol,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateAndAcceptOperationService,
      quotationService,
      mockGetQuotation,
      mockCreateQuotationService,
      userService,
      mockGetUserByUuid,
      mockGetOnboardingByUserAndStatusIsFinished,
    } = mockService();

    const sut = new UseCase(
      logger,
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
      cashbackOperationTransactionTag,
      conversionSystemName,
      symbolCurrencyMidQuote,
    );
    return {
      sut,
      mockPendingCryptoOrder,
      mockReadyConversion,
      mockReadyCashback,
      mockCreateConversionRepository,
      mockCreateCryptoOrderRepository,
      mockGetByNameSystemRepository,
      mockGetByIdCashbackRepository,
      mockCreateCashbackRepository,
      mockGetCurrencyBySymbol,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateAndAcceptOperationService,
      mockGetQuotation,
      mockCreateQuotationService,
      mockGetUserByUuid,
      mockGetOnboardingByUserAndStatusIsFinished,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const test = [
        () => sut.execute(null, null, null, null, null, null),
        () => sut.execute(faker.datatype.uuid(), null, null, null, null, null),
        () => sut.execute(null, user, null, null, null, null),
        () => sut.execute(null, null, null, currency, null, null, null),
        () =>
          sut.execute(null, null, null, null, null, faker.datatype.number()),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
        expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
        expect(mockReadyConversion).toHaveBeenCalledTimes(0);
        expect(mockReadyCashback).toHaveBeenCalledTimes(0);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
        expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(0);
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
      }
    });

    it('TC0002 - Should not create if user is different', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const otherUser = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const cashback = await CashbackFactory.create<CashbackEntity>(
        CashbackEntity.name,
        { user: otherUser },
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          cashback.id,
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );

      mockGetByIdCashbackRepository.mockResolvedValue(cashback);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
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
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
    });

    it('TC0003 - Should not create if user is not found', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );

      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
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
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
    });

    it('TC0004 - Should not create if user cpf or full name not exists', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      let cont = 1;

      for (const i in user) {
        if (i == 'fullName' || i == 'document') {
          const previous = user[i];
          user[i] = null;

          const testScript = () =>
            sut.execute(
              faker.datatype.uuid(),
              user,
              wallet,
              currency,
              currency,
              faker.datatype.number({ min: 1, max: 99999 }),
            );
          mockGetByIdCashbackRepository.mockResolvedValue(null);
          mockGetUserByUuid.mockResolvedValue(user);

          await expect(testScript).rejects.toThrow(MissingDataException);
          expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
          expect(mockReadyConversion).toHaveBeenCalledTimes(0);
          expect(mockReadyCashback).toHaveBeenCalledTimes(0);
          expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
          expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
          expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
          expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(cont);
          expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
          expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
          expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(
            0,
          );
          expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
          expect(mockGetQuotation).toHaveBeenCalledTimes(0);
          expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
          expect(mockGetUserByUuid).toHaveBeenCalledTimes(cont);
          expect(
            mockGetOnboardingByUserAndStatusIsFinished,
          ).toHaveBeenCalledTimes(0);
          user[i] = previous;
          cont++;
        }
      }
    });

    it('TC0005 - Should not create if onboarding is not found', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );
      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
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
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0006 - Should not create if quotation is not found', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );
      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValue(currency);
      mockGetQuotation.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(QuotationNotFoundException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0007 - Should not create if quotation is not created', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );
      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValue(currency);
      mockGetQuotation.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(QuotationNotFoundException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0008 - Should not create if quotation fields are missing', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const fields = [
        'provider',
        'baseCurrency',
        'quoteCurrency',
        'baseAmountBuy',
        'baseAmountSell',
        'quoteAmountBuy',
        'quoteAmountSell',
        'partialBuy',
        'partialSell',
        'spreadBuyAmount',
        'spreadSellAmount',
        'side',
      ];

      let i = 1;
      for (const q in quotation) {
        for (const f of fields) {
          if (f == q) {
            const previous = quotation[q];
            quotation[q] = null;

            const testScript = () =>
              sut.execute(
                faker.datatype.uuid(),
                user,
                wallet,
                currency,
                currency,
                faker.datatype.number({ min: 1, max: 99999 }),
              );
            mockGetByIdCashbackRepository.mockResolvedValue(null);
            mockGetUserByUuid.mockResolvedValue(user);
            mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(
              onboarding,
            );
            mockGetCurrencyBySymbol.mockResolvedValue(currency);
            mockGetQuotation.mockResolvedValue(quotation);

            await expect(testScript).rejects.toThrow(MissingDataException);
            expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
            expect(mockReadyConversion).toHaveBeenCalledTimes(0);
            expect(mockReadyCashback).toHaveBeenCalledTimes(0);
            expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
            expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
            expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
            expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(i);
            expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
            expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2 * i);
            expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(
              0,
            );
            expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(
              0,
            );
            expect(mockGetQuotation).toHaveBeenCalledTimes(i);
            expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
            expect(mockGetUserByUuid).toHaveBeenCalledTimes(i);
            expect(
              mockGetOnboardingByUserAndStatusIsFinished,
            ).toHaveBeenCalledTimes(i);
            i++;
            quotation[q] = previous;
          }
        }
      }
    });

    it('TC0009 - Should not create if currency not exists', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );
      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0010 - Should not create if wallet account is not found', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const foundCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          wallet,
          currency,
          currency,
          faker.datatype.number({ min: 1, max: 99999 }),
        );
      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetQuotation.mockResolvedValue(quotation);
      mockGetCurrencyBySymbol.mockResolvedValue(foundCurrency);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      expect(mockGetByIdCashbackRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCashbackRepository).toHaveBeenCalledTimes(0);
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperationService).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('With valid parameters', () => {
    it('TC0011 - Should create with valid parameters - user CPF', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        document: '12345678911',
      });

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
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

      const foundCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        {
          user,
        },
      );

      mockGetByIdCashbackRepository.mockResolvedValue(undefined);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetQuotation.mockResolvedValue(quotation);
      mockGetCurrencyBySymbol.mockResolvedValue(foundCurrency);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      const amount = faker.datatype.number({ min: 1, max: 99999 });

      const result = await sut.execute(
        faker.datatype.uuid(),
        user,
        wallet,
        currency,
        currency,
        amount,
      );

      expect(result).toBeDefined();
      expect(result.conversion.amount).toBe(quotation.baseAmountBuy);
      expect(result.conversion.quote).toBe(
        String(quotation.streamQuotation.composedBy[0].buy),
      );
      expect(result.conversion.fiatAmount).toBe(quotation.partialBuy);
      expect(result.conversion.user).toBe(user);
      expect(result.conversion.currency).toBe(foundCurrency);
      expect(result.conversion.conversionType).toBe(OrderSide.BUY);
      expect(result.conversion.clientName).toBe(user.fullName);
      expect(result.conversion.clientDocument).toBe(user.document);
      expect(result.conversion.quotation).toBe(quotation);
      expect(result.conversion.operation).toBeDefined();
      expect(result.conversion.operation.rawValue).toBe(
        quotation.baseAmountBuy,
      );
      expect(result.conversion.operation.currency).toBe(foundCurrency);
      expect(result.conversion.operation.description).toBe('CASHBACK');
      expect(result.user).toBe(user);
      expect(result.user).toBe(result.conversion.user);
      expect(result.amount).toBe(amount);
      expect(result.currency).toBe(foundCurrency);
      expect(result.currency).toBe(result.conversion.currency);
      expect(result.description).toBeUndefined();
      expect(result.issuedBy).toBeUndefined();
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockReadyConversion).toHaveBeenCalledTimes(1);
      expect(mockReadyCashback).toHaveBeenCalledTimes(1);
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
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0012 - Should create with valid parameters - user CNPJ', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        document: '123456789111',
      });

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
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

      const foundCurrency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { user },
      );

      const amount = faker.datatype.number({ min: 1, max: 99999 });

      mockGetByIdCashbackRepository.mockResolvedValue(null);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetQuotation.mockResolvedValue(quotation);
      mockGetCurrencyBySymbol.mockResolvedValue(foundCurrency);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      const result = await sut.execute(
        faker.datatype.uuid(),
        user,
        wallet,
        currency,
        currency,
        amount,
      );

      expect(result).toBeDefined();
      expect(result.conversion.amount).toBe(quotation.baseAmountBuy);
      expect(result.conversion.quote).toBe(
        String(quotation.streamQuotation.composedBy[0].buy),
      );
      expect(result.conversion.fiatAmount).toBe(quotation.partialBuy);
      expect(result.conversion.user).toBe(user);
      expect(result.conversion.currency).toBe(foundCurrency);
      expect(result.conversion.conversionType).toBe(OrderSide.BUY);
      expect(result.conversion.clientName).toBe(user.fullName);
      expect(result.conversion.clientDocument).toBe(user.document);
      expect(result.conversion.quotation).toBe(quotation);
      expect(result.conversion.operation).toBeDefined();
      expect(result.conversion.operation.rawValue).toBe(
        quotation.baseAmountBuy,
      );
      expect(result.conversion.operation.currency).toBe(foundCurrency);
      expect(result.conversion.operation.description).toBe('CASHBACK');
      expect(result.user).toBe(user);
      expect(result.user).toBe(result.conversion.user);
      expect(result.amount).toBe(amount);
      expect(result.currency).toBe(foundCurrency);
      expect(result.currency).toBe(result.conversion.currency);
      expect(result.description).toBeUndefined();
      expect(result.issuedBy).toBeUndefined();
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockReadyConversion).toHaveBeenCalledTimes(1);
      expect(mockReadyCashback).toHaveBeenCalledTimes(1);
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
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
    });

    it('TC0013 - Should return if cashback already exists', async () => {
      const {
        sut,
        mockPendingCryptoOrder,
        mockReadyConversion,
        mockReadyCashback,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockGetByNameSystemRepository,
        mockGetByIdCashbackRepository,
        mockCreateCashbackRepository,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperationService,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const amount = faker.datatype.number({ min: 1, max: 99999 });

      const cashback = await CashbackFactory.create<CashbackEntity>(
        CashbackEntity.name,
        {
          user,
        },
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdCashbackRepository.mockResolvedValue(cashback);

      const result = await sut.execute(
        faker.datatype.uuid(),
        user,
        wallet,
        currency,
        currency,
        amount,
      );

      expect(result).toBeDefined();
      expect(result).toBe(cashback);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockReadyCashback).toHaveBeenCalledTimes(0);
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
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
    });
  });
});
