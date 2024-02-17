import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import {
  CurrencyEntity,
  WalletEntity,
  WalletState,
} from '@zro/operations/domain';
import { CashbackEntity } from '@zro/otc/domain';
import {
  OnboardingRepository,
  ReferralRewardEntity,
  ReferralRewardRepository,
} from '@zro/users/domain';
import {
  OperationService,
  OtcService,
  SyncReferralRewardConversionCashbackUseCase as UseCase,
} from '@zro/users/application';
import { QuotationAmountUnderMinAmountException } from '@zro/quotations/application';
import { CurrencyFactory, WalletFactory } from '@zro/test/operations/config';
import { ReferralRewardFactory } from '@zro/test/users/config';
import { CashbackFactory } from '@zro/test/otc/config';

describe('SyncReferralRewardConversionCashbackUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const affiliateSizeMinimum = 3;
  const referralRewardIntervalStartDays = 7;
  const referralRewardIntervalEndDays = 1;
  const cashbackOperationTransactionTag = 'CASHBACK';

  const mockRepository = () => {
    const referralRewardRepository: ReferralRewardRepository =
      createMock<ReferralRewardRepository>();
    const mockGetReferralRewardByPaymentOperation: jest.Mock = On(
      referralRewardRepository,
    ).get(
      method(
        (mock) =>
          mock.getByPaymentOperationIsNullAndCreatedAtStartAndCreatedAtEnd,
      ),
    );
    const mockUpdateReferralReward: jest.Mock = On(
      referralRewardRepository,
    ).get(method((mock) => mock.update));

    const onboardingRepository: OnboardingRepository =
      createMock<OnboardingRepository>();
    const mockCountByReferredBy: jest.Mock = On(onboardingRepository).get(
      method(
        (mock) => mock.countByReferredByAndAffiliateTypeAndStatusIsFinished,
      ),
    );

    return {
      referralRewardRepository,
      onboardingRepository,
      mockGetReferralRewardByPaymentOperation,
      mockUpdateReferralReward,
      mockCountByReferredBy,
    };
  };

  const mockService = () => {
    const otcService: OtcService = createMock<OtcService>();
    const mockCreateCashback: jest.Mock = On(otcService).get(
      method((mock) => mock.createCashback),
    );

    const operationService: OperationService = createMock<OperationService>();
    const mockGetDefaultWalletService: jest.Mock = On(operationService).get(
      method((mock) => mock.getWalletByUserAndDefaultIsTrue),
    );

    return {
      otcService,
      operationService,
      mockCreateCashback,
      mockGetDefaultWalletService,
    };
  };

  const makeSut = () => {
    const {
      referralRewardRepository,
      onboardingRepository,
      mockGetReferralRewardByPaymentOperation,
      mockUpdateReferralReward,
      mockCountByReferredBy,
    } = mockRepository();

    const {
      otcService,
      operationService,
      mockCreateCashback,
      mockGetDefaultWalletService,
    } = mockService();

    const sut = new UseCase(
      logger,
      referralRewardRepository,
      onboardingRepository,
      otcService,
      operationService,
      cashbackOperationTransactionTag,
      referralRewardIntervalStartDays,
      referralRewardIntervalEndDays,
      affiliateSizeMinimum,
    );

    return {
      sut,
      mockGetReferralRewardByPaymentOperation,
      mockUpdateReferralReward,
      mockCreateCashback,
      mockGetDefaultWalletService,
      mockCountByReferredBy,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not sync referral reward without params', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockCreateCashback,
      } = makeSut();

      const testScript = () => sut.execute(null, null);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(0);
      expect(mockCreateCashback).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not sync without referral reward', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([]);

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(0);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not sync referral reward without valid awardedTo uuid', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const referralReward =
        await ReferralRewardFactory.create<ReferralRewardEntity>(
          ReferralRewardEntity.name,
          { awardedTo: null },
        );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([
        referralReward,
      ]);

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(0);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not sync referral reward without affiliates enough', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
        mockGetDefaultWalletService,
        mockCountByReferredBy,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const referralReward =
        await ReferralRewardFactory.create<ReferralRewardEntity>(
          ReferralRewardEntity.name,
        );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([
        referralReward,
      ]);
      mockCountByReferredBy.mockResolvedValue(1);

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCountByReferredBy).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(0);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(0);
      expect(mockGetDefaultWalletService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not sync referral reward without valid cashback created', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
        mockGetDefaultWalletService,
        mockCountByReferredBy,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const referralReward =
        await ReferralRewardFactory.create<ReferralRewardEntity>(
          ReferralRewardEntity.name,
        );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([
        referralReward,
      ]);
      mockCountByReferredBy.mockResolvedValue(affiliateSizeMinimum);
      mockUpdateReferralReward.mockImplementation((i) => i);
      mockGetDefaultWalletService.mockResolvedValue(wallet);
      mockCreateCashback.mockRejectedValue(new Error('Fake'));

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCountByReferredBy).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(1);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletService).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should not sync referral reward when quotation amount is not enough', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
        mockCountByReferredBy,
        mockGetDefaultWalletService,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const referralReward =
        await ReferralRewardFactory.create<ReferralRewardEntity>(
          ReferralRewardEntity.name,
        );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([
        referralReward,
      ]);
      mockCountByReferredBy.mockResolvedValue(affiliateSizeMinimum);
      mockUpdateReferralReward.mockImplementation((i) => i);
      mockCreateCashback.mockRejectedValue(
        new QuotationAmountUnderMinAmountException({}),
      );
      mockGetDefaultWalletService.mockResolvedValue(wallet);

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCountByReferredBy).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletService).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(1);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(2);
    });
  });

  describe('With valid parameters', () => {
    it('TC0007 - Should sync referral reward successfully', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
        mockCountByReferredBy,
        mockGetDefaultWalletService,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const referralReward =
        await ReferralRewardFactory.create<ReferralRewardEntity>(
          ReferralRewardEntity.name,
        );
      const cashback = await CashbackFactory.create<CashbackEntity>(
        CashbackEntity.name,
      );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([
        referralReward,
      ]);
      mockCountByReferredBy.mockResolvedValue(affiliateSizeMinimum);
      mockUpdateReferralReward.mockImplementation((i) => i);
      mockCreateCashback.mockResolvedValue(cashback);
      mockGetDefaultWalletService.mockResolvedValue(wallet);

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCountByReferredBy).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(1);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(2);
      expect(mockGetDefaultWalletService).toHaveBeenCalledTimes(1);
    });

    it('TC0008 - Should sync referral reward with group', async () => {
      const {
        sut,
        mockGetReferralRewardByPaymentOperation,
        mockUpdateReferralReward,
        mockCreateCashback,
        mockCountByReferredBy,
        mockGetDefaultWalletService,
      } = makeSut();

      const currency = await CurrencyFactory.create<CurrencyEntity>(
        CurrencyEntity.name,
      );
      const cashback = await CashbackFactory.create<CashbackEntity>(
        CashbackEntity.name,
      );
      const referralReward =
        await ReferralRewardFactory.create<ReferralRewardEntity>(
          ReferralRewardEntity.name,
          { group: cashback.conversion.id },
        );
      const wallet = await WalletFactory.create<WalletEntity>(
        WalletEntity.name,
        { state: WalletState.ACTIVE },
      );

      mockGetReferralRewardByPaymentOperation.mockResolvedValue([
        referralReward,
      ]);
      mockCountByReferredBy.mockResolvedValue(affiliateSizeMinimum);
      mockUpdateReferralReward.mockImplementation((i) => i);
      mockCreateCashback.mockResolvedValue(cashback);
      mockGetDefaultWalletService.mockResolvedValue(wallet);

      await sut.execute(currency, currency);

      expect(mockGetReferralRewardByPaymentOperation).toHaveBeenCalledTimes(1);
      expect(mockCountByReferredBy).toHaveBeenCalledTimes(1);
      expect(mockCreateCashback).toHaveBeenCalledTimes(1);
      expect(mockUpdateReferralReward).toHaveBeenCalledTimes(1);
      expect(mockGetDefaultWalletService).toHaveBeenCalledTimes(1);
    });
  });
});
