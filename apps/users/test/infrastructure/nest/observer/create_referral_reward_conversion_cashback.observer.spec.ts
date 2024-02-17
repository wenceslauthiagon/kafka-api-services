import { createMock } from 'ts-auto-mock';
import { ConfigService } from '@nestjs/config';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  OnboardingEntity,
  OnboardingRepository,
  PersonType,
  ReferralRewardRepository,
  UserEntity,
  UserRepository,
} from '@zro/users/domain';
import { OperationEntity } from '@zro/operations/domain';
import { OperationService } from '@zro/users/application';
import {
  CreateReferralRewardConversionCashbackConfig,
  CreateReferralRewardConversionCashbackNestObserver as Observer,
} from '@zro/users/infrastructure';
import { HandleCreateReferralRewardConversionCashbackEventRequest } from '@zro/users/interface';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { OperationFactory } from '@zro/test/operations/config';

describe('CreateReferralRewardConversionCashbackNestObserver', () => {
  let conversionCurrencySymbol: string;
  let transactionTagValid: string;
  let module: TestingModule;
  let observer: Observer;

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
  const mockCreateReferralReward: jest.Mock = On(referralRewardRepository).get(
    method((mock) => mock.create),
  );

  const operationService: OperationService = createMock<OperationService>();
  const mockGetCurrencyBySymbol: jest.Mock = On(operationService).get(
    method((mock) => mock.getCurrencyBySymbol),
  );

  beforeEach(() => jest.resetAllMocks());

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    observer = module.get<Observer>(Observer);

    const configService: ConfigService<CreateReferralRewardConversionCashbackConfig> =
      module.get(ConfigService);
    conversionCurrencySymbol = configService.get<string>(
      'APP_SYNC_REFERRAL_REWARD_CONVERSION_CURRENCY_SYMBOL',
    );
    transactionTagValid = configService.get<string>(
      'APP_REFERRAL_REWARD_VALID_CONVERSION_TRANSACTION_TAG',
    );
  });

  describe('HandlePendingUserEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create successfully', async () => {
        const operation = await OperationFactory.create<OperationEntity>(
          OperationEntity.name,
        );
        operation.transactionType.tag = transactionTagValid;
        operation.currency.symbol = conversionCurrencySymbol;

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

        mockGetCurrencyBySymbol.mockResolvedValueOnce(operation.currency);
        mockGetUserById
          .mockResolvedValueOnce(affiliateUser)
          .mockResolvedValueOnce(referredByUser);
        mockGetOnboardingByUser.mockResolvedValue(affiliateUserOnboarding);

        const message: HandleCreateReferralRewardConversionCashbackEventRequest =
          {
            ownerOperation: {
              id: operation.id,
              value: operation.value,
              fee: operation.fee,
              rawValue: operation.rawValue,
              description: operation.description,
              state: operation.state,
              ownerId: operation.owner.id,
              currencyId: operation.currency.id,
              transactionId: operation.transactionType.id,
              transactionTag: operation.transactionType.tag,
            },
          };

        await observer.execute(
          message,
          userRepository,
          onboardingRepository,
          referralRewardRepository,
          operationService,
          logger,
        );

        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(1);
        expect(mockGetUserById).toHaveBeenCalledTimes(2);
        expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(1);
        expect(mockCreateReferralReward).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not handle if value is negative', async () => {
        const operation = await OperationFactory.create<OperationEntity>(
          OperationEntity.name,
        );

        const message: HandleCreateReferralRewardConversionCashbackEventRequest =
          {
            ownerOperation: {
              id: operation.id,
              value: -operation.value,
              fee: operation.fee,
              rawValue: operation.rawValue,
              description: operation.description,
              state: operation.state,
              ownerId: operation.owner.id,
              currencyId: operation.currency.id,
              transactionId: operation.transactionType.id,
              transactionTag: operation.transactionType.tag,
            },
          };

        const testScript = () =>
          observer.execute(
            message,
            userRepository,
            onboardingRepository,
            referralRewardRepository,
            operationService,
            logger,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetUserById).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
        expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not handle if owner id is 0', async () => {
        const operation = await OperationFactory.create<OperationEntity>(
          OperationEntity.name,
        );

        const message: HandleCreateReferralRewardConversionCashbackEventRequest =
          {
            ownerOperation: {
              id: operation.id,
              value: operation.value,
              fee: operation.fee,
              rawValue: operation.rawValue,
              description: operation.description,
              state: operation.state,
              ownerId: 0,
              currencyId: operation.currency.id,
              transactionId: operation.transactionType.id,
              transactionTag: operation.transactionType.tag,
            },
          };

        const testScript = () =>
          observer.execute(
            message,
            userRepository,
            onboardingRepository,
            referralRewardRepository,
            operationService,
            logger,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetUserById).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
        expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not handle if transactionTag is empty', async () => {
        const operation = await OperationFactory.create<OperationEntity>(
          OperationEntity.name,
        );

        const message: HandleCreateReferralRewardConversionCashbackEventRequest =
          {
            ownerOperation: {
              id: operation.id,
              value: operation.value,
              fee: operation.fee,
              rawValue: operation.rawValue,
              description: operation.description,
              state: operation.state,
              ownerId: operation.owner.id,
              currencyId: operation.currency.id,
              transactionId: operation.transactionType.id,
              transactionTag: '',
            },
          };

        const testScript = () =>
          observer.execute(
            message,
            userRepository,
            onboardingRepository,
            referralRewardRepository,
            operationService,
            logger,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetCurrencyBySymbol).toHaveBeenCalledTimes(0);
        expect(mockGetUserById).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingByUser).toHaveBeenCalledTimes(0);
        expect(mockCreateReferralReward).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
