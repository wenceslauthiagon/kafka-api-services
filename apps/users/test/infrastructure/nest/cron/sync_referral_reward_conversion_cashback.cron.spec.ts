import { v4 as uuidV4 } from 'uuid';
import { Mutex } from 'redis-semaphore';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getMoment, KafkaService } from '@zro/common';
import { OnboardingStatus } from '@zro/users/domain';
import { CurrencyEntity, WalletState } from '@zro/operations/domain';
import {
  OnboardingModel,
  ReferralRewardModel,
  SyncReferralRewardConversionCashbackCronConfig,
  SyncReferralRewardConversionCashbackCronService as Cron,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { CurrencyFactory } from '@zro/test/operations/config';
import {
  OnboardingFactory,
  ReferralRewardFactory,
  UserFactory,
} from '@zro/test/users/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncReferralRewardConversionCashbackCronService', () => {
  let module: TestingModule;
  let controller: Cron;
  let affiliateSizeMinimum: number;

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockSendKafkaService: jest.Mock = On(kafkaService).get(
    method((mock) => mock.send),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Cron>(Cron);

    const configService: ConfigService<SyncReferralRewardConversionCashbackCronConfig> =
      module.get(ConfigService);
    affiliateSizeMinimum = configService.get<number>(
      'APP_REFERRAL_REWARD_MIN_LENGTH',
    );
  });

  beforeEach(async () => {
    jest.resetAllMocks();
    await ReferralRewardModel.truncate();
  });

  describe('Sync', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not sync referral reward without valid awardedTo uuid', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const referral =
          await ReferralRewardFactory.create<ReferralRewardModel>(
            ReferralRewardModel.name,
            {
              createdAt: new Date(),
              awardedToUuid: null,
              paymentOperationId: null,
            },
          );

        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute(currency, currency);

        const result = await ReferralRewardModel.findOne({
          where: { id: referral.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(referral.id);
        expect(result.operationId).toBe(referral.operationId);
        expect(result.paymentOperationId).toBeNull();
        expect(mockSendKafkaService).toHaveBeenCalledTimes(0);
      });

      it('TC0002 - Should not sync referral reward without valid createdAt start', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const referral =
          await ReferralRewardFactory.create<ReferralRewardModel>(
            ReferralRewardModel.name,
            { createdAt: new Date(99), paymentOperationId: null },
          );

        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute(currency, currency);

        const result = await ReferralRewardModel.findOne({
          where: { id: referral.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(referral.id);
        expect(result.operationId).toBe(referral.operationId);
        expect(result.paymentOperationId).toBeNull();
        expect(mockSendKafkaService).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not sync referral reward without valid createdAt end', async () => {
        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const referral =
          await ReferralRewardFactory.create<ReferralRewardModel>(
            ReferralRewardModel.name,
            { createdAt: new Date(), paymentOperationId: null },
          );

        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute(currency, currency);

        const result = await ReferralRewardModel.findOne({
          where: { id: referral.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(referral.id);
        expect(result.operationId).toBe(referral.operationId);
        expect(result.paymentOperationId).toBeNull();
        expect(mockSendKafkaService).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0004 - Should execute successfully', async () => {
        const awardedTo = await UserFactory.create<UserModel>(UserModel.name);
        for (let index = 0; index < affiliateSizeMinimum; index++) {
          const user = await UserFactory.create<UserModel>(UserModel.name, {
            referredById: awardedTo.id,
          });
          await OnboardingFactory.create<OnboardingModel>(
            OnboardingModel.name,
            { status: OnboardingStatus.FINISHED, userId: user.id },
          );
        }

        const currency = await CurrencyFactory.create<CurrencyEntity>(
          CurrencyEntity.name,
        );
        const referral =
          await ReferralRewardFactory.create<ReferralRewardModel>(
            ReferralRewardModel.name,
            {
              createdAt: getMoment().subtract(2, 'days').toDate(),
              paymentOperationId: null,
              awardedToId: awardedTo.id,
              awardedToUuid: awardedTo.uuid,
            },
          );

        mockSendKafkaService.mockResolvedValueOnce({
          uuid: uuidV4(),
          userId: uuidV4(),
          state: WalletState.ACTIVE,
        });

        const conversionOperationId = uuidV4();
        mockSendKafkaService.mockResolvedValueOnce({
          id: uuidV4(),
          conversionId: uuidV4(),
          conversionOperationId,
        });

        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute(currency, currency);

        const result = await ReferralRewardModel.findOne({
          where: { id: referral.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(referral.id);
        expect(result.operationId).toBe(referral.operationId);
        expect(result.paymentOperationId).toBe(conversionOperationId);
        expect(mockSendKafkaService).toHaveBeenCalledTimes(2);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
