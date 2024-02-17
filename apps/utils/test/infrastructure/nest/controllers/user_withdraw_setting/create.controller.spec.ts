import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWithdrawSettingEntity,
  UserWithdrawSettingRepository,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';
import {
  CreateUserWithdrawSettingMicroserviceController as Controller,
  UserWithdrawSettingDatabaseRepository,
} from '@zro/utils/infrastructure';
import { AppModule } from '@zro/utils/infrastructure/nest/modules/app.module';
import {
  CreateUserWithdrawSettingRequest,
  UserWithdrawSettingEventEmitterControllerInterface,
  UserWithdrawSettingEventType,
} from '@zro/utils/interface';
import { UserWithdrawSettingFactory } from '@zro/test/utils/config';

describe('CreateUserWithdrawSettingMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWithdrawSettingRepository: UserWithdrawSettingRepository;

  const eventEmitterController: UserWithdrawSettingEventEmitterControllerInterface =
    createMock<UserWithdrawSettingEventEmitterControllerInterface>();
  const mockCreatedEvent: jest.Mock = On(eventEmitterController).get(
    method((mock) => mock.emitUserWithdrawSettingEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWithdrawSettingRepository = new UserWithdrawSettingDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateUserWithdrawSetting', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create if missing params', async () => {
        const message: CreateUserWithdrawSettingRequest = {
          id: null,
          type: null,
          balance: null,
          day: null,
          weekDay: null,
          userId: null,
          walletId: null,
          transactionTypeTag: null,
          pixKey: null,
          pixKeyType: null,
        };

        const test = () =>
          controller.execute(
            userWithdrawSettingRepository,
            eventEmitterController,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
        expect(mockCreatedEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create daily type successfully', async () => {
        const userWithdrawSetting =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
            UserWithdrawSettingEntity.name,
            { type: WithdrawSettingType.DAILY },
          );

        const message: CreateUserWithdrawSettingRequest = {
          id: userWithdrawSetting.id,
          type: userWithdrawSetting.type,
          balance: userWithdrawSetting.balance,
          day: null,
          weekDay: null,
          userId: userWithdrawSetting.user.uuid,
          walletId: userWithdrawSetting.wallet.uuid,
          transactionTypeTag: userWithdrawSetting.transactionType.tag,
          pixKey: userWithdrawSetting.pixKey.key,
          pixKeyType: userWithdrawSetting.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRepository,
          eventEmitterController,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSetting.id);
        expect(result.value.type).toBe(userWithdrawSetting.type);
        expect(result.value.balance).toBe(userWithdrawSetting.balance);
        expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingEventType.CREATED,
        );
      });

      it('TC0003 - Should create weekly type successfully', async () => {
        const userWithdrawSetting =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
            UserWithdrawSettingEntity.name,
            {
              type: WithdrawSettingType.WEEKLY,
              weekDay: WithdrawSettingWeekDays.MONDAY,
            },
          );

        const message: CreateUserWithdrawSettingRequest = {
          id: userWithdrawSetting.id,
          type: userWithdrawSetting.type,
          balance: userWithdrawSetting.balance,
          day: null,
          weekDay: userWithdrawSetting.weekDay,
          userId: userWithdrawSetting.user.uuid,
          walletId: userWithdrawSetting.wallet.uuid,
          transactionTypeTag: userWithdrawSetting.transactionType.tag,
          pixKey: userWithdrawSetting.pixKey.key,
          pixKeyType: userWithdrawSetting.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRepository,
          eventEmitterController,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSetting.id);
        expect(result.value.type).toBe(userWithdrawSetting.type);
        expect(result.value.balance).toBe(userWithdrawSetting.balance);
        expect(result.value.weekDay).toBe(userWithdrawSetting.weekDay);
        expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingEventType.CREATED,
        );
      });

      it('TC0004 - Should create monthly type successfully', async () => {
        const userWithdrawSetting =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
            UserWithdrawSettingEntity.name,
            {
              type: WithdrawSettingType.MONTHLY,
              day: 5,
            },
          );

        const message: CreateUserWithdrawSettingRequest = {
          id: userWithdrawSetting.id,
          type: userWithdrawSetting.type,
          balance: userWithdrawSetting.balance,
          day: userWithdrawSetting.day,
          weekDay: null,
          userId: userWithdrawSetting.user.uuid,
          walletId: userWithdrawSetting.wallet.uuid,
          transactionTypeTag: userWithdrawSetting.transactionType.tag,
          pixKey: userWithdrawSetting.pixKey.key,
          pixKeyType: userWithdrawSetting.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRepository,
          eventEmitterController,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSetting.id);
        expect(result.value.type).toBe(userWithdrawSetting.type);
        expect(result.value.balance).toBe(userWithdrawSetting.balance);
        expect(result.value.day).toBe(userWithdrawSetting.day);
        expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingEventType.CREATED,
        );
      });

      it('TC0005 - Should create balance type successfully', async () => {
        const userWithdrawSetting =
          await UserWithdrawSettingFactory.create<UserWithdrawSettingEntity>(
            UserWithdrawSettingEntity.name,
            {
              type: WithdrawSettingType.BALANCE,
            },
          );

        const message: CreateUserWithdrawSettingRequest = {
          id: userWithdrawSetting.id,
          type: userWithdrawSetting.type,
          balance: userWithdrawSetting.balance,
          day: null,
          weekDay: null,
          userId: userWithdrawSetting.user.uuid,
          walletId: userWithdrawSetting.wallet.uuid,
          transactionTypeTag: userWithdrawSetting.transactionType.tag,
          pixKey: userWithdrawSetting.pixKey.key,
          pixKeyType: userWithdrawSetting.pixKey.type,
        };

        const result = await controller.execute(
          userWithdrawSettingRepository,
          eventEmitterController,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSetting.id);
        expect(result.value.type).toBe(userWithdrawSetting.type);
        expect(result.value.balance).toBe(userWithdrawSetting.balance);
        expect(mockCreatedEvent).toHaveBeenCalledTimes(1);
        expect(mockCreatedEvent.mock.calls[0][0]).toBe(
          UserWithdrawSettingEventType.CREATED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
