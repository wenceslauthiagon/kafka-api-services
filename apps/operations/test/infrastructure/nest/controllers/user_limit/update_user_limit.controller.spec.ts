import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  GlobalLimitRepository,
  LimitTypeRepository,
  UserLimitRepository,
} from '@zro/operations/domain';
import {
  DailyLimitExceededException,
  MaxAmountLimitExceededException,
  MaxAmountNightlyLimitExceededException,
  NightlyLimitExceededException,
} from '@zro/operations/application';
import {
  UpdateUserLimitRequest,
  UserLimitEventEmitterControllerInterface,
} from '@zro/operations/interface';
import {
  UpdateUserLimitMicroserviceController as Controller,
  UserLimitDatabaseRepository,
  GlobalLimitDatabaseRepository,
  LimitTypeModel,
  GlobalLimitModel,
  LimitTypeDatabaseRepository,
  UserServiceKafka,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  GlobalLimitFactory,
  LimitTypeFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';

describe('UpdateUserLimitMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userLimitRepository: UserLimitRepository;
  let globalLimitRepository: GlobalLimitRepository;
  let limitTypeRepository: LimitTypeRepository;

  const userLimitEventEmitter: UserLimitEventEmitterControllerInterface =
    createMock<UserLimitEventEmitterControllerInterface>();

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  beforeEach(() => jest.resetAllMocks());

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userLimitRepository = new UserLimitDatabaseRepository();
    globalLimitRepository = new GlobalLimitDatabaseRepository();
    limitTypeRepository = new LimitTypeDatabaseRepository();
  });

  afterEach(async () => {
    GlobalLimitModel.truncate({
      cascade: true,
    });
    LimitTypeModel.truncate({
      cascade: true,
    });
  });

  describe('UpdateUserLimit', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update User Limit interval successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          nighttimeStart: '22:00',
          nighttimeEnd: '06:00',
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeEnd).toBe('06:00');
          expect(res.nighttimeStart).toBeDefined();
          expect(res.nighttimeStart).toBe('22:00');
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0002 - Should not update User Limit interval if missing start or end', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          nighttimeEnd: '24:00',
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeEnd).toBe('06:00');
          expect(res.nighttimeStart).toBeDefined();
          expect(res.nighttimeStart).toBe('20:00');
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0003 - Should update User Daily limit successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            dailyLimit: 5000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userDailyLimit: 4000,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBe(4000);
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeEnd).toBe('06:00');
          expect(res.nighttimeStart).toBeDefined();
          expect(res.nighttimeStart).toBe('20:00');
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0004 - Should update User Monthly limit successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            monthlyLimit: 5000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMonthlyLimit: 4000,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBe(4000);
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeEnd).toBe('06:00');
          expect(res.nighttimeStart).toBeDefined();
          expect(res.nighttimeStart).toBe('20:00');
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0005 - Should update User Yearly limit successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            yearlyLimit: 5000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userYearlyLimit: 4000,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBe(4000);
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeEnd).toBe('06:00');
          expect(res.nighttimeStart).toBeDefined();
          expect(res.nighttimeStart).toBe('20:00');
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0006 - Should update User Nightly limit successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            nightlyLimit: 5000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userNightlyLimit: 4000,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBe(4000);
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeEnd).toBe('06:00');
          expect(res.nighttimeStart).toBeDefined();
          expect(res.nighttimeStart).toBe('20:00');
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0007 - Should update userDailyLimit successfully for Pix with drawal', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            dailyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userDailyLimit: 500,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBe(500);
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0008 - Should update userDailyLimit successfully for Pix change', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXCHANGE' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            dailyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userDailyLimit: 500,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBe(500);
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0009 - Should update userNightlyLimit successfully for Pix change', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXCHANGE' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            nightlyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userNightlyLimit: 100,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBe(100);
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0010 - Should not update userNightlyLimit successfully for Pix change if value is biggest than 100', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXCHANGE' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            nightlyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userNightlyLimit: 10001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            globalLimitRepository,
            limitTypeRepository,
            userLimitEventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(NightlyLimitExceededException);
      });

      it('TC0011 - Should not update userNightlyLimit successfully for Pix with drawal if value is biggest than 100', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            nightlyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userNightlyLimit: 10001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            globalLimitRepository,
            limitTypeRepository,
            userLimitEventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(NightlyLimitExceededException);
      });

      it('TC0012 - Should not update userDailyLimit successfully for Pix with drawal if value is biggest than 500', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            dailyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userDailyLimit: 50001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            globalLimitRepository,
            limitTypeRepository,
            userLimitEventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(DailyLimitExceededException);
      });

      it('TC0013 - Should not update userDailyLimit successfully for Pix change if value is biggest than 500', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXCHANGE' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            dailyLimit: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userDailyLimit: 50001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            globalLimitRepository,
            limitTypeRepository,
            userLimitEventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(DailyLimitExceededException);
      });

      it('TC0014 - Should not update userMaxAmount successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXCHANGE' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            maxAmount: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMaxAmount: 50001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            globalLimitRepository,
            limitTypeRepository,
            userLimitEventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          MaxAmountLimitExceededException,
        );
      });

      it('TC0015 - Should not update userMaxAmountNightly successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXCHANGE' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            maxAmountNightly: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMaxAmountNightly: 50001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const testScript = () =>
          controller.execute(
            userLimitRepository,
            globalLimitRepository,
            limitTypeRepository,
            userLimitEventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          MaxAmountNightlyLimitExceededException,
        );
      });

      it('TC0016 - Should update userMaxAmount successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            maxAmount: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMaxAmount: 500,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBe(500);
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0017 - Should update userMaxAmountNighly successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            maxAmountNightly: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMaxAmountNightly: 500,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBe(500);
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0018 - Should update userMinAmount successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            minAmount: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMinAmount: 1001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBe(1001);
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });

      it('TC0019 - Should update userMinAmountNighly successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
          { tag: 'PIXWITHDRAWAL' },
        );

        await GlobalLimitFactory.create<GlobalLimitModel>(
          GlobalLimitModel.name,
          {
            limitTypeId: limitType.id,
            minAmountNightly: 1000,
          },
        );

        const message: UpdateUserLimitRequest = {
          userId: user.uuid,
          limitTypesIds: [limitType.id],
          userMinAmountNightly: 1001,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userLimitEventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBe(1001);
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
      });
    });
  });
  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
