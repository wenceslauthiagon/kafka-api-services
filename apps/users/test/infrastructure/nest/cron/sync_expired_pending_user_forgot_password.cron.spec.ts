import { Mutex } from 'redis-semaphore';
import { Test, TestingModule } from '@nestjs/testing';
import { UserForgotPasswordState } from '@zro/users/domain';
import {
  UserForgotPasswordModel,
  SyncPendingExpiredUserForgotPasswordCronService as Cron,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserForgotPasswordFactory } from '@zro/test/users/config';
import { getMoment } from '@zro/common';

jest.mock('redis-semaphore');
jest.mock('ioredis');

const MINUTE_IN_SECONDS = 60;
const TIMESTAMP = 10 * MINUTE_IN_SECONDS; // 10 minutes in seconds.

describe('SyncPendingExpiredUserForgotPasswordCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(() => jest.resetAllMocks());

  describe('Sync', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not sync user forgot password without valid state', async () => {
        const userForgotPassword =
          await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
            UserForgotPasswordModel.name,
            {
              state: UserForgotPasswordState.CONFIRMED,
            },
          );
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute();

        const result = await UserForgotPasswordModel.findOne({
          where: { id: userForgotPassword.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(userForgotPassword.id);
        expect(result.state).toBe(UserForgotPasswordState.CONFIRMED);
        expect(result.expiredAt).toBeNull();
      });

      it('TC0002 - Should not sync user forgot password if not expired', async () => {
        const expiredDate = getMoment()
          .subtract(TIMESTAMP, 'seconds')
          .add(MINUTE_IN_SECONDS, 'seconds')
          .toDate();

        const userForgotPassword =
          await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
            UserForgotPasswordModel.name,
            {
              state: UserForgotPasswordState.PENDING,
              createdAt: expiredDate,
            },
          );

        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute();

        const result = await UserForgotPasswordModel.findOne({
          where: { id: userForgotPassword.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(userForgotPassword.id);
        expect(result.state).toBe(UserForgotPasswordState.PENDING);
        expect(result.expiredAt).toBeNull();
      });
    });

    describe('With valid parameters', () => {
      it('TC0003 - Should execute successfully', async () => {
        const expiredDate = getMoment()
          .subtract(TIMESTAMP, 'seconds')
          .subtract(MINUTE_IN_SECONDS, 'seconds')
          .toDate();

        const userForgotPassword =
          await UserForgotPasswordFactory.create<UserForgotPasswordModel>(
            UserForgotPasswordModel.name,
            {
              state: UserForgotPasswordState.PENDING,
              createdAt: expiredDate,
            },
          );
        jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);

        await controller.execute();

        const result = await UserForgotPasswordModel.findOne({
          where: { id: userForgotPassword.id },
        });
        expect(result).toBeDefined();
        expect(result.id).toBe(userForgotPassword.id);
        expect(result.state).toBe(UserForgotPasswordState.EXPIRED);
        expect(result.expiredAt).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
