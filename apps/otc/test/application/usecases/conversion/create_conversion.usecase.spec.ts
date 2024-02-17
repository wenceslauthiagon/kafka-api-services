import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  ConversionEntity,
  ConversionRepository,
  CryptoOrderRepository,
  OrderSide,
  SystemEntity,
  SystemRepository,
} from '@zro/otc/domain';
import {
  CreateConversionUseCase as UseCase,
  ConversionEventEmitter,
  CryptoOrderEventEmitter,
  OperationService,
  QuotationService,
  UserService,
} from '@zro/otc/application';
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
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import {
  CurrencyNotFoundException,
  WalletAccountNotFoundException,
} from '@zro/operations/application';
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

describe('CreateConversionUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockStreamQuotationFactory = async () =>
    StreamQuotationFactory.create<StreamQuotationEntity>(
      StreamQuotationEntity.name,
      {
        composedBy: [
          await StreamQuotationFactory.create<StreamQuotationEntity>(
            StreamQuotationEntity.name,
            {
              quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
                CurrencyEntity.name,
                {
                  id: 3,
                  symbol: 'USD',
                  decimal: 2,
                  tag: 'USD',
                  type: CurrencyType.FIAT,
                },
              ),
              baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
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
              quoteCurrency: await CurrencyFactory.create<CurrencyEntity>(
                CurrencyEntity.name,
                {
                  id: 1,
                  symbol: 'BRL',
                  decimal: 2,
                  tag: 'BRL',
                  type: CurrencyType.FIAT,
                },
              ),
              baseCurrency: await CurrencyFactory.create<CurrencyEntity>(
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
    );

  const mockRepository = () => {
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

    return {
      conversionRepository,
      mockGetByIdConversionRepository,
      mockCreateConversionRepository,
      cryptoOrderRepository,
      mockCreateCryptoOrderRepository,
      systemRepository,
      mockGetByNameSystemRepository,
    };
  };

  const mockEmitter = () => {
    const conversionEmitter: ConversionEventEmitter =
      createMock<ConversionEventEmitter>();
    const mockReadyConversion: jest.Mock = On(conversionEmitter).get(
      method((mock) => mock.readyConversion),
    );

    const cryptoOrderEmitter: CryptoOrderEventEmitter =
      createMock<CryptoOrderEventEmitter>();
    const mockPendingCryptoOrder: jest.Mock = On(cryptoOrderEmitter).get(
      method((mock) => mock.pendingCryptoOrder),
    );

    return {
      conversionEmitter,
      mockReadyConversion,
      cryptoOrderEmitter,
      mockPendingCryptoOrder,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuid: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingByUserAndStatusIsFinished: jest.Mock = On(
      userService,
    ).get(method((mock) => mock.getOnboardingByUserAndStatusIsFinished));

    const operationService: OperationService = createMock<OperationService>();
    const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
      method((mock) => mock.getCurrencyBySymbol),
    );
    const mockGetWalletAccountByUserAndCurrency: jest.Mock = On(
      operationService,
    ).get(method((mock) => mock.getWalletAccountByWalletAndCurrency));
    const mockCreateAndAcceptOperation: jest.Mock = On(operationService).get(
      method((mock) => mock.createAndAcceptOperation),
    );
    const mockGetLimitTypesByFilter: jest.Mock = On(operationService).get(
      method((mock) => mock.getLimitTypesByFilter),
    );
    const mockGetUserLimitsByFilter: jest.Mock = On(operationService).get(
      method((mock) => mock.getUserLimitsByFilter),
    );
    const mockGetAllActiveCurrencies: jest.Mock = On(operationService).get(
      method((mock) => mock.getAllActiveCurrencies),
    );

    const quotationService: QuotationService = createMock<QuotationService>();
    const mockCreateQuotationService: jest.Mock = On(quotationService).get(
      method((mock) => mock.createQuotation),
    );
    const mockGetCurrentQuotationById: jest.Mock = On(quotationService).get(
      method((mock) => mock.getCurrentQuotationById),
    );
    const mockGetQuotation: jest.Mock = On(quotationService).get(
      method((mock) => mock.getQuotation),
    );

    return {
      userService,
      mockGetUserByUuid,
      mockGetOnboardingByUserAndStatusIsFinished,
      operationService,
      mockGetCurrencyBySymbol,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateAndAcceptOperation,
      quotationService,
      mockGetQuotation,
      mockGetCurrentQuotationById,
      mockCreateQuotationService,
      mockGetLimitTypesByFilter,
      mockGetUserLimitsByFilter,
      mockGetAllActiveCurrencies,
    };
  };

  const makeSut = () => {
    const conversionOperationTransactionTag = 'tag';
    const conversionSystemName = 'system';
    const symbolCurrencyMidQuote = 'USD';
    const conversionDepositOperationDescription = 'beneficiary';
    const conversionWithdrawalOperationDescription = 'owner';

    const {
      conversionRepository,
      mockGetByIdConversionRepository,
      mockCreateConversionRepository,
      cryptoOrderRepository,
      mockCreateCryptoOrderRepository,
      systemRepository,
      mockGetByNameSystemRepository,
    } = mockRepository();

    const {
      conversionEmitter,
      mockReadyConversion,
      cryptoOrderEmitter,
      mockPendingCryptoOrder,
    } = mockEmitter();

    const {
      userService,
      mockGetUserByUuid,
      mockGetOnboardingByUserAndStatusIsFinished,
      operationService,
      mockGetCurrencyBySymbol,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateAndAcceptOperation,
      quotationService,
      mockGetQuotation,
      mockGetCurrentQuotationById,
      mockCreateQuotationService,
      mockGetLimitTypesByFilter,
      mockGetUserLimitsByFilter,
      mockGetAllActiveCurrencies,
    } = mockService();

    const sut = new UseCase(
      logger,
      conversionRepository,
      cryptoOrderRepository,
      systemRepository,
      conversionEmitter,
      cryptoOrderEmitter,
      userService,
      operationService,
      quotationService,
      conversionOperationTransactionTag,
      conversionDepositOperationDescription,
      conversionWithdrawalOperationDescription,
      conversionSystemName,
      symbolCurrencyMidQuote,
    );

    return {
      sut,
      mockGetByIdConversionRepository,
      mockCreateConversionRepository,
      mockCreateCryptoOrderRepository,
      mockReadyConversion,
      mockPendingCryptoOrder,
      mockGetUserByUuid,
      mockGetOnboardingByUserAndStatusIsFinished,
      mockGetCurrencyBySymbol,
      mockGetWalletAccountByUserAndCurrency,
      mockCreateAndAcceptOperation,
      mockGetQuotation,
      mockGetCurrentQuotationById,
      mockCreateQuotationService,
      mockGetByNameSystemRepository,
      mockGetLimitTypesByFilter,
      mockGetUserLimitsByFilter,
      mockGetAllActiveCurrencies,
    };
  };

  const systemName = 'system';

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockCreateQuotationService,
        mockGetCurrentQuotationById,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const test = [
        () => sut.execute(null, null, null, null, null),
        () => sut.execute(uuidV4(), null, null, null, null),
        () => sut.execute(null, user, null, null, null),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
        expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
        expect(mockReadyConversion).toHaveBeenCalledTimes(0);
        expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
        expect(
          mockGetOnboardingByUserAndStatusIsFinished,
        ).toHaveBeenCalledTimes(0);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
        expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
        expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(0);
        expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
        expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should not create if user id is different', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );
      const conversion = await ConversionFactory.create<ConversionEntity>(
        ConversionEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(conversion.id, user, wallet, quotation, systemName);
      mockGetByIdConversionRepository.mockResolvedValue(conversion);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(0);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if quotation is not created', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);
      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(QuotationNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if quotation fields are missing', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetCurrentQuotationById,
        mockGetByNameSystemRepository,
      } = makeSut();

      let test;
      let i = 0;

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const fields = [
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
        'iofAmount',
        'side',
      ];

      for (const q in quotation) {
        for (const f of fields) {
          if (q == f) {
            const previous = quotation[q];
            i++;
            quotation[q] = null;
            mockGetByIdConversionRepository.mockResolvedValueOnce(null);

            test = () =>
              sut.execute(uuidV4(), user, wallet, quotation, systemName);

            await expect(test).rejects.toThrow(MissingDataException);
            expect(mockGetQuotation).toHaveBeenCalledTimes(0);
            expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(i);
            expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
            expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(i);
            expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
            expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
            expect(mockReadyConversion).toHaveBeenCalledTimes(0);
            expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
            expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
            expect(
              mockGetOnboardingByUserAndStatusIsFinished,
            ).toHaveBeenCalledTimes(0);
            expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
            expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(
              0,
            );
            expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
            expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
            quotation[q] = previous;
          }
        }
      }
    });

    it('TC0005 - Should not create if user not exists', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetCurrentQuotationById,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);
      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if cpf not exists', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockCreateQuotationService,
        mockGetCurrentQuotationById,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        document: null,
      });

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);
      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if fullname not exists', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        fullName: null,
      });

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);
      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create if finished onboarding not exists', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);
      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(null);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not create if base currency is not found', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should not create if quote currency is not found', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currency);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);

      await expect(testScript).rejects.toThrow(CurrencyNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not create if wallet account by currency base is not found', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValue(currency);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(1);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should not create if wallet account by currency quote is not found', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValue(currency);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValueOnce(
        walletAccount,
      );
      mockGetWalletAccountByUserAndCurrency.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(uuidV4(), user, wallet, quotation, systemName);

      await expect(testScript).rejects.toThrow(WalletAccountNotFoundException);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0014 - Should return if conversion already exists', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
      );

      const conversion = await ConversionFactory.create<ConversionEntity>(
        ConversionEntity.name,
      );
      conversion.user = user;

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(conversion);

      const result = await sut.execute(
        conversion.id,
        user,
        wallet,
        quotation,
        systemName,
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(conversion.id);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(0);
      expect(mockReadyConversion).toHaveBeenCalledTimes(0);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        0,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(0);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(0);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(0);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(0);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - Should create with valid parameters - side Sell (with cpf)', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 2, symbol: 'BTC', decimal: 8, tag: 'BTC' },
      );

      const currencyUSD = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 3, symbol: 'USD', decimal: 2, tag: 'USD' },
      );

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.SELL, streamQuotation: mockStreamQuotationFactory() },
      );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyBTC);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyUSD);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      const id = uuidV4();
      const result = await sut.execute(id, user, wallet, quotation, systemName);

      expect(result).toBeDefined();
      expect(result.usdAmount).toBe(
        Math.round(
          quotation.partialSell / quotation.streamQuotation.composedBy[1].sell,
        ),
      );
      expect(result.quote).toBe(
        String(quotation.streamQuotation.composedBy[0].sell),
      );
      expect(result.usdQuote).toBe(
        quotation.streamQuotation.composedBy[1].sell * 100,
      );
      expect(result.amount).toBe(quotation.baseAmountSell);
      expect(result.fiatAmount).toBe(quotation.partialSell);
      expect(result.conversionType).toBe(quotation.side);
      expect(result.currency).toBe(currencyBTC);
      expect(result.id).toBe(id);
      expect(result.user).toBe(user);
      expect(result.clientName).toBe(user.fullName);
      expect(result.clientDocument).toBe(user.document);
      expect(result.operation).toBeDefined();
      expect(result.operation.rawValue).toBe(quotation.baseAmountSell);
      expect(result.operation.currency).toBe(currencyBTC);
      expect(result.operation.description).toBe('owner');
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockReadyConversion).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0016 - Should create with valid parameters - side Buy (with cpf)', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 2, symbol: 'BTC', decimal: 8, tag: 'BTC' },
      );

      const currencyUSD = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 3, symbol: 'USD', decimal: 2, tag: 'USD' },
      );

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, streamQuotation: mockStreamQuotationFactory() },
      );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyBTC);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyUSD);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      const id = uuidV4();
      const result = await sut.execute(id, user, wallet, quotation, systemName);

      expect(result).toBeDefined();
      expect(result.usdAmount).toBe(
        Math.round(
          quotation.partialBuy / quotation.streamQuotation.composedBy[1].buy,
        ),
      );
      expect(result.quote).toBe(
        String(quotation.streamQuotation.composedBy[0].buy),
      );
      expect(result.usdQuote).toBe(
        quotation.streamQuotation.composedBy[1].buy * 100,
      );
      expect(result.amount).toBe(quotation.baseAmountBuy);
      expect(result.fiatAmount).toBe(quotation.partialBuy);
      expect(result.conversionType).toBe(quotation.side);
      expect(result.currency).toBe(currencyBTC);
      expect(result.id).toBe(id);
      expect(result.user).toBe(user);
      expect(result.clientName).toBe(user.fullName);
      expect(result.clientDocument).toBe(user.document);
      expect(result.operation).toBeDefined();
      expect(result.operation.rawValue).toBe(quotation.baseAmountBuy);
      expect(result.operation.description).toBe('beneficiary');
      expect(result.operation.currency).toBe(currencyBTC);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockReadyConversion).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0017 - Should create with valid parameters - side Buy (with cnpj)', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 2, symbol: 'BTC', decimal: 8, tag: 'BTC' },
      );

      const currencyUSD = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 3, symbol: 'USD', decimal: 2, tag: 'USD' },
      );

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        { side: OrderSide.BUY, streamQuotation: mockStreamQuotationFactory() },
      );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyBTC);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyUSD);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      const id = uuidV4();
      const result = await sut.execute(id, user, wallet, quotation, systemName);

      expect(result).toBeDefined();
      expect(result.usdAmount).toBe(
        Math.round(
          quotation.partialBuy / quotation.streamQuotation.composedBy[1].buy,
        ),
      );
      expect(result.quote).toBe(
        String(quotation.streamQuotation.composedBy[0].buy),
      );
      expect(result.usdQuote).toBe(
        quotation.streamQuotation.composedBy[1].buy * 100,
      );
      expect(result.amount).toBe(quotation.baseAmountBuy);
      expect(result.fiatAmount).toBe(quotation.partialBuy);
      expect(result.conversionType).toBe(quotation.side);
      expect(result.currency).toBe(currencyBTC);
      expect(result.id).toBe(id);
      expect(result.user).toBe(user);
      expect(result.clientName).toBe(user.fullName);
      expect(result.clientDocument).toBe(user.document);
      expect(result.operation).toBeDefined();
      expect(result.operation.rawValue).toBe(quotation.baseAmountBuy);
      expect(result.operation.description).toBe('beneficiary');
      expect(result.operation.currency).toBe(currencyBTC);
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockReadyConversion).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0018 - Should create with valid parameters - side Sell (with cnpj)', async () => {
      const {
        sut,
        mockGetByIdConversionRepository,
        mockCreateConversionRepository,
        mockCreateCryptoOrderRepository,
        mockReadyConversion,
        mockPendingCryptoOrder,
        mockGetUserByUuid,
        mockGetOnboardingByUserAndStatusIsFinished,
        mockGetCurrencyBySymbol,
        mockGetWalletAccountByUserAndCurrency,
        mockCreateAndAcceptOperation,
        mockGetQuotation,
        mockGetCurrentQuotationById,
        mockCreateQuotationService,
        mockGetByNameSystemRepository,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const currencyBTC = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 2, symbol: 'BTC', decimal: 8, tag: 'BTC' },
      );

      const currencyUSD = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
        { id: 3, symbol: 'USD', decimal: 2, tag: 'USD' },
      );

      const quotation = await QuotationFactory.create<QuotationEntity>(
        QuotationEntity.name,
        {
          side: OrderSide.SELL,
          streamQuotation: mockStreamQuotationFactory(),
        },
      );

      const system = await SystemFactory.create<SystemEntity>(
        SystemEntity.name,
      );

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const walletAccount =
        await WalletAccountFactory.create<WalletAccountEntity>(
          WalletAccountEntity.name,
          { state: WalletAccountState.ACTIVE },
        );

      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
      );

      mockGetByIdConversionRepository.mockResolvedValue(null);
      mockGetCurrentQuotationById.mockResolvedValue(quotation);
      mockGetUserByUuid.mockResolvedValue(user);
      mockGetOnboardingByUserAndStatusIsFinished.mockResolvedValue(onboarding);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyBTC);
      mockGetCurrencyBySymbol.mockResolvedValueOnce(currencyUSD);
      mockGetWalletAccountByUserAndCurrency.mockResolvedValue(walletAccount);
      mockGetByNameSystemRepository.mockResolvedValue(system);

      const id = uuidV4();
      const result = await sut.execute(id, user, wallet, quotation, systemName);

      expect(result).toBeDefined();
      expect(result.usdAmount).toBe(
        Math.round(
          quotation.partialSell / quotation.streamQuotation.composedBy[1].sell,
        ),
      );
      expect(result.quote).toBe(
        String(quotation.streamQuotation.composedBy[0].sell),
      );
      expect(result.usdQuote).toBe(
        quotation.streamQuotation.composedBy[1].sell * 100,
      );
      expect(result.amount).toBe(quotation.baseAmountSell);
      expect(result.fiatAmount).toBe(quotation.partialSell);
      expect(result.conversionType).toBe(quotation.side);
      expect(result.currency).toBe(currencyBTC);
      expect(result.id).toBe(id);
      expect(result.user).toBe(user);
      expect(result.clientName).toBe(user.fullName);
      expect(result.clientDocument).toBe(user.document);
      expect(result.operation).toBeDefined();
      expect(result.operation.rawValue).toBe(quotation.baseAmountSell);
      expect(result.operation.currency).toBe(currencyBTC);
      expect(result.operation.description).toBe('owner');
      expect(mockGetByIdConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateConversionRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateCryptoOrderRepository).toHaveBeenCalledTimes(1);
      expect(mockReadyConversion).toHaveBeenCalledTimes(1);
      expect(mockPendingCryptoOrder).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuid).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUserAndStatusIsFinished).toHaveBeenCalledTimes(
        1,
      );
      expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(2);
      expect(mockGetWalletAccountByUserAndCurrency).toHaveBeenCalledTimes(2);
      expect(mockCreateAndAcceptOperation).toHaveBeenCalledTimes(1);
      expect(mockGetQuotation).toHaveBeenCalledTimes(0);
      expect(mockGetCurrentQuotationById).toHaveBeenCalledTimes(1);
      expect(mockCreateQuotationService).toHaveBeenCalledTimes(1);
      expect(mockGetByNameSystemRepository).toHaveBeenCalledTimes(1);
    });
  });
});
