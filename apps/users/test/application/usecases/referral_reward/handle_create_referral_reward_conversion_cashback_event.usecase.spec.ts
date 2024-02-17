import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  formatValueFromFloatToInt,
  formatValueFromIntBpsToFloat,
  MissingDataException,
} from '@zro/common';
import { CurrencyEntity, OperationEntity } from '@zro/operations/domain';
import {
  OnboardingEntity,
  OnboardingRepository,
  PersonType,
  ReferralRewardRepository,
  UserEntity,
  UserRepository,
} from '@zro/users/domain';
import { HandleCreateReferralRewardConversionCashbackEventUseCase as UseCase } from '@zro/users/application';
import { OperationFactory } from '@zro/test/operations/config';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';

describe('HandleCreateReferralRewardConversionCashbackEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const conversionCurrency = new CurrencyEntity({
    id: 2,
    decimal: 2,
    symbol: 'BRL',
  });
  const transactionTagValid = 'CONV';
  const affiliateMonthMinimum = 12;
  const cashbackAmountBps = 10;

  const mockRepository = () => {
    const userRepository: UserRepository = createMock<UserRepository>();
    const mockGetUserById: jest.Mock = On(userRepository).get(
      method((mock) => mock.getById),
    );
    const onboardingRepository: OnboardingRepository =
      createMock<OnboardingRepository>();
    const mockGetOnboardingByUser: jest.Mock = On(onboardingRepository).get(
      method((mock) => mock.getByUserAndStatusIsFinished),
    );

    const referralRewardRepository: ReferralRewardRepository =
      createMock<ReferralRewardRepository>();
    const mockCreateReferralReward: jest.Mock = On(
      referralRewardRepository,
    ).get(method((mock) => mock.create));

    return {
      userRepository,
      onboardingRepository,
      referralRewardRepository,
      mockGetUserById,
      mockCreateReferralReward,
      mockGetOnboardingByUser,
    };
  };

  const makeSut = () => {
    const {
      userRepository,
      onboardingRepository,
      referralRewardRepository,
      mockGetUserById,
      mockCreateReferralReward,
      mockGetOnboardingByUser,
    } = mockRepository();

    const sut = new UseCase(
      logger,
      userRepository,
      onboardingRepository,
      referralRewardRepository,
      transactionTagValid,
      affiliateMonthMinimum,
      cashbackAmountBps,
    );

    return {
      sut,
      mockGetUserById,
      mockCreateReferralReward,
      mockGetOnboardingByUser,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create referral reward without params', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const testScript = () => sut.execute(null, null, conversionCurrency);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserById).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create without valid transactionTag', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create referral reward without currency', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create referral reward without valid currency', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { owner: null },
      );
      operation.transactionType.tag = transactionTagValid;

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create referral reward without affiliate', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
        { owner: null, beneficiary: null },
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create referral reward without affiliate user', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      mockGetUserById.mockResolvedValue(null);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create referral reward without natural person affiliate type', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.LEGAL_PERSON },
      );

      mockGetUserById.mockResolvedValueOnce(affiliateUser);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create referral reward without referredBy user', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: null },
      );

      mockGetUserById.mockResolvedValueOnce(affiliateUser);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not create referral reward with same user and referredBy', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON },
      );
      affiliateUser.referredBy = new UserEntity({ id: affiliateUser.id });

      mockGetUserById.mockResolvedValueOnce(affiliateUser);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should not create referral reward without natural person referredBy type', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const legalPersonReferredByUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.LEGAL_PERSON, referredBy: null },
      );
      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        {
          type: PersonType.NATURAL_PERSON,
          referredBy: legalPersonReferredByUser,
        },
      );

      mockGetUserById
        .mockResolvedValueOnce(affiliateUser)
        .mockResolvedValueOnce(legalPersonReferredByUser);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(2);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not create referral reward without valid onboarding', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const referredByUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: null },
      );
      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: referredByUser },
      );

      mockGetUserById
        .mockResolvedValueOnce(affiliateUser)
        .mockResolvedValueOnce(referredByUser);
      mockGetOnboardingByUser.mockResolvedValueOnce(null);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(2);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(1);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should not create referral reward without a new account', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const referredByUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: null },
      );
      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: referredByUser },
      );
      const affiliateUserOnboarding =
        await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
          { updatedAt: new Date(99) },
        );

      mockGetUserById
        .mockResolvedValueOnce(affiliateUser)
        .mockResolvedValueOnce(referredByUser);
      mockGetOnboardingByUser.mockResolvedValue(affiliateUserOnboarding);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeUndefined();
      expect(mockGetUserById).toHaveBeenCalledTimes(2);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(1);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0013 - Should create referral reward with ownerOperation successfully', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const referredByUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: null },
      );
      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: referredByUser },
      );
      const affiliateUserOnboarding =
        await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
          { updatedAt: new Date() },
        );

      mockGetUserById
        .mockResolvedValueOnce(affiliateUser)
        .mockResolvedValueOnce(referredByUser);
      mockGetOnboardingByUser.mockResolvedValue(affiliateUserOnboarding);
      mockCreateReferralReward.mockImplementation((res) => res);

      const result = await sut.execute(operation, null, conversionCurrency);

      expect(result).toBeDefined();
      expect(result.amount).toBe(
        formatValueFromFloatToInt(
          Math.min(operation.value, operation.rawValue) *
            formatValueFromIntBpsToFloat(cashbackAmountBps),
        ),
      );
      expect(result.operation).toMatchObject(operation);
      expect(mockGetUserById).toHaveBeenCalledTimes(2);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(1);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(1);
    });

    it('TC0014 - Should create referral reward with beneficiaryOperation successfully', async () => {
      const {
        sut,
        mockGetUserById,
        mockCreateReferralReward,
        mockGetOnboardingByUser,
      } = makeSut();

      const operation = await OperationFactory.create<OperationEntity>(
        OperationEntity.name,
      );
      operation.transactionType.tag = transactionTagValid;
      operation.currency = conversionCurrency;

      const referredByUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: null },
      );
      const affiliateUser = await UserFactory.create<UserEntity>(
        UserEntity.name,
        { type: PersonType.NATURAL_PERSON, referredBy: referredByUser },
      );
      const affiliateUserOnboarding =
        await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
          { updatedAt: new Date() },
        );

      mockGetUserById
        .mockResolvedValueOnce(affiliateUser)
        .mockResolvedValueOnce(referredByUser);
      mockGetOnboardingByUser.mockResolvedValue(affiliateUserOnboarding);
      mockCreateReferralReward.mockImplementation((res) => res);

      const result = await sut.execute(null, operation, conversionCurrency);

      expect(result).toBeDefined();
      expect(result.amount).toBe(
        formatValueFromFloatToInt(
          Math.min(operation.value, operation.rawValue) *
            formatValueFromIntBpsToFloat(cashbackAmountBps),
        ),
      );
      expect(result.operation).toMatchObject(operation);
      expect(mockGetUserById).toHaveBeenCalledTimes(2);
      expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(1);
      expect(mockCreateReferralReward).toHaveBeenCalledTimes(1);
    });
  });
});
