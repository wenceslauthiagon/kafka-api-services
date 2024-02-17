import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserLimitRepository } from '@zro/operations/domain';
import {
  UpdateUserLimitByAdminMicroserviceController as Controller,
  UserLimitDatabaseRepository,
  UserLimitModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  UpdateUserLimitByAdminRequest,
  UserLimitEventEmitterControllerInterface,
  UserLimitEventType,
} from '@zro/operations/interface';
import { UserLimitFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';

describe('UpdateUserLimitByAdminMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userLimitRepository: UserLimitRepository;

  const userLimitEventEmitter: UserLimitEventEmitterControllerInterface =
    createMock<UserLimitEventEmitterControllerInterface>();
  const mockEmitUserLimitEvent: jest.Mock = On(userLimitEventEmitter).get(
    method((mock) => mock.emitUserLimitEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userLimitRepository = new UserLimitDatabaseRepository();
  });

  describe('UpdateUserLimitByAdmin', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update user limit successfully', async () => {
        const userLimit = await UserLimitFactory.create<UserLimitModel>(
          UserLimitModel.name,
          {
            yearlyLimit: 12000,
            monthlyLimit: 10000,
            dailyLimit: 1500,
            nightlyLimit: 500,
            maxAmount: 100,
            minAmount: 1,
            maxAmountNightly: 100,
            minAmountNightly: 1,
          },
        );

        const message: UpdateUserLimitByAdminRequest = {
          userLimitId: userLimit.id,
          yearlyLimit: 13000,
          monthlyLimit: 1100,
          dailyLimit: 700,
          nightlyLimit: 500,
          maxAmount: 500,
          minAmount: 1,
          maxAmountNightly: 100,
          minAmountNightly: 1,
        };

        const result = await controller.execute(
          userLimitRepository,
          userLimitEventEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.limitTypeId).toBeDefined();
        expect(result.value.nightlyLimit).toBe(500);
        expect(result.value.dailyLimit).toBe(700);
        expect(result.value.monthlyLimit).toBe(1100);
        expect(result.value.yearlyLimit).toBe(13000);
        expect(result.value.maxAmount).toBe(500);
        expect(result.value.minAmount).toBe(1);
        expect(result.value.maxAmountNightly).toBe(100);
        expect(result.value.minAmountNightly).toBe(1);
        expect(result.value.userMaxAmount).toBeDefined();
        expect(result.value.userMinAmount).toBeDefined();
        expect(result.value.userMaxAmountNightly).toBeDefined();
        expect(result.value.userMinAmountNightly).toBeDefined();
        expect(result.value.userDailyLimit).toBeDefined();
        expect(result.value.userDailyLimit).toBeDefined();
        expect(result.value.userMonthlyLimit).toBeDefined();
        expect(result.value.userYearlyLimit).toBeDefined();
        expect(result.value.userNightlyLimit).toBeDefined();
        expect(result.value.nighttimeEnd).toBeDefined();
        expect(result.value.nighttimeStart).toBeDefined();
        expect(result.value.nighttimeStart).toBeDefined();
        expect(result.value.nighttimeEnd).toBeDefined();
        expect(mockEmitUserLimitEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitUserLimitEvent.mock.calls[0][0]).toBe(
          UserLimitEventType.UPDATED,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should throw if any limit parameter is negative', async () => {
        const message: UpdateUserLimitByAdminRequest = {
          userLimitId: uuidV4(),
          dailyLimit: -10,
        };

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            userLimitEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
