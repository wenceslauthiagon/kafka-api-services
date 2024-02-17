import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  DatabaseModule,
  DATABASE_PROVIDER,
  defaultLogger as logger,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { LimitType, UserLimitEntity } from '@zro/operations/domain';
import {
  DailyLimitExceededException,
  DataException,
  MaxAmountLimitExceededException,
  MaxAmountNightlyLimitExceededException,
  MinAmountLimitBelowException,
  MinAmountNightlyLimitBelowException,
  MonthlyLimitExceededException,
  NightlyLimitExceededException,
  NighttimeIntervalInvalidException,
  UpdateUserLimitUseCase,
  UserLimitEventEmitter,
  YearlyLimitExceededException,
} from '@zro/operations/application';
import {
  CurrencyModel,
  UserLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
  GlobalLimitDatabaseRepository,
  GlobalLimitModel,
  LimitTypeDatabaseRepository,
  UserLimitDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GlobalLimitFactory,
  LimitTypeFactory,
  UserLimitFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('Testing operation change limits user', () => {
  let module: TestingModule;
  let sequelize: Sequelize;

  const mockUserLimitEventEmitter = () => {
    const userLimitEventEmitter: UserLimitEventEmitter =
      createMock<UserLimitEventEmitter>();

    const mockUpdatedUserLimitEvent: jest.Mock = On(userLimitEventEmitter).get(
      method((mock) => mock.updatedUserLimit),
    );

    return { userLimitEventEmitter, mockUpdatedUserLimitEvent };
  };

  const executeUseCase = async (
    user: User,
    limitTypes: LimitType[],
    newUserLimits: UserLimitEntity,
  ) => {
    const transaction = await sequelize.transaction();

    try {
      const userLimitDatabaseRepository = new UserLimitDatabaseRepository();
      const globalLimitDatabaseRepository = new GlobalLimitDatabaseRepository();
      const limitTypeDatabaseRepository = new LimitTypeDatabaseRepository();

      const { userLimitEventEmitter } = mockUserLimitEventEmitter();

      const nighttimeIntervals = '22:00;06:00 20:00;06:00';

      const userLimitUseCase = new UpdateUserLimitUseCase(
        logger,
        userLimitDatabaseRepository,
        globalLimitDatabaseRepository,
        limitTypeDatabaseRepository,
        userLimitEventEmitter,
        nighttimeIntervals,
      );

      const operation = await userLimitUseCase.execute(
        user,
        limitTypes,
        newUserLimits,
      );

      await transaction.commit();

      return operation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          TransactionTypeModel,
          LimitTypeModel,
          UserLimitModel,
          GlobalLimitModel,
        ]),
      ],
    }).compile();

    sequelize = module.get(DATABASE_PROVIDER);
  });

  it('TC0001 - Should update nighttime interval correctly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    const newUserLimits = new UserLimitEntity({
      nighttimeStart: '22:00',
      nighttimeEnd: '06:00',
    });

    const limitTypes = [limitType];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe(newUserLimits.nighttimeStart);
      expect(res.nighttimeEnd).toBe(newUserLimits.nighttimeEnd);
    });
  });

  it('TC0002 - Should not update nighttime interval if start and end arent defined', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    const newUserLimits = new UserLimitEntity({
      nighttimeStart: '22:00',
    });

    const limitTypes = [limitType];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0003 - Should throw a NighttimeIntervalInvalidException if interval is invalid', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    const newUserLimits = new UserLimitEntity({
      nighttimeStart: '23:00',
      nighttimeEnd: '22:00',
    });

    const limitTypes = [limitType];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(NighttimeIntervalInvalidException);
  });

  it('TC0004 - Should create with model with valid user limits', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      nightlyLimit: 100,
      dailyLimit: 10000,
      monthlyLimit: 20000,
      yearlyLimit: 30000,
    });

    const newUserLimits = new UserLimitEntity({
      userNightlyLimit: 50,
      userDailyLimit: 7500,
      userMonthlyLimit: 15000,
      userYearlyLimit: 25000,
    });

    const limitTypes = [limitType.get()];

    const userLimitUseCase = await executeUseCase(
      user,
      limitTypes,
      newUserLimits,
    );

    expect(userLimitUseCase).toBeDefined();
    userLimitUseCase.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0005 - Nightly - Should not create with model with values great than limits', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      nightlyLimit: 100,
    });
    const userLimits = new UserLimitEntity({
      userNightlyLimit: 101,
    });

    const limitTypes = [limitType];

    await expect(executeUseCase(user, limitTypes, userLimits)).rejects.toThrow(
      NightlyLimitExceededException,
    );
  });

  it('TC0006 - Daily - Should not create with model with values great than limits', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      dailyLimit: 100,
    });

    const userLimits = new UserLimitEntity({
      userDailyLimit: 15000,
    });

    const limitTypes = [limitType];

    await expect(executeUseCase(user, limitTypes, userLimits)).rejects.toThrow(
      DailyLimitExceededException,
    );
  });

  it('TC0007 - Monthly - Should not create with model with values great than limits', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      monthlyLimit: 200,
    });

    const userLimits = new UserLimitEntity({
      userMonthlyLimit: 21000,
    });

    const limitTypes = [limitType];

    await expect(executeUseCase(user, limitTypes, userLimits)).rejects.toThrow(
      MonthlyLimitExceededException,
    );
  });

  it('TC0009 - Yearly - Should not create with model with values great than limits', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
      userId: user.id,
      limitTypeId: limitType.id,
      yearlyLimit: 30000,
    });
    const userLimits = new UserLimitEntity({
      userYearlyLimit: 35000,
    });

    const limitTypes = [limitType];

    await expect(executeUseCase(user, limitTypes, userLimits)).rejects.toThrow(
      YearlyLimitExceededException,
    );
  });

  it('TC0010 - Should throw a DailyLimitExceededException if userDailyLimit is biggest than 500 for Pix with drawal', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      dailyLimit: 50000,
      nightlyLimit: 10000,
    });

    const newUserLimits = new UserLimitEntity({
      userDailyLimit: 50100,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(DailyLimitExceededException);
  });

  it('TC0011 - Should throw a DailyLimitExceededException if userDailyLimit is biggest than 500 for Pix change', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      dailyLimit: 50000,
      nightlyLimit: 10000,
    });

    const newUserLimits = new UserLimitEntity({
      userDailyLimit: 50100,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(DailyLimitExceededException);
  });

  it('TC0012 - Should throw a NightlyLimitExceededException if userNightlyLimit is biggest than 100 for Pix with drawal', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    const newUserLimits = new UserLimitEntity({
      userNightlyLimit: 101,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(NightlyLimitExceededException);
  });

  it('TC0013 - Should throw a NightlyLimitExceededException if userNightlyLimit is biggest than 100 for Pix change', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
    });

    const newUserLimits = new UserLimitEntity({
      userNightlyLimit: 10100,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(NightlyLimitExceededException);
  });

  it('TC0014 - Should update a userNightlyLimit to smaller or equal than 100 for Pix with drawal', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      nightlyLimit: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userNightlyLimit: 99,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userNightlyLimit).toBe(99);
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0015 - Should update a userNightlyLimit to smaller or equal than 100 for Pix change', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      nightlyLimit: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userNightlyLimit: 99,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userNightlyLimit).toBe(99);
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0016 - Should update a userDailyLimit to smaller or equal than 500 for Pix with drawal', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      dailyLimit: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userDailyLimit: 499,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userDailyLimit).toBe(499);
      expect(res.userMonthlyLimit).toBeDefined();
      expect(res.userYearlyLimit).toBeDefined();
      expect(res.userNightlyLimit).toBeDefined();
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0017 - Should update a userDailyLimit to smaller or equal than 500 for Pix change', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      dailyLimit: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userDailyLimit: 499,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userDailyLimit).toBe(499);
      expect(res.userMonthlyLimit).toBeDefined();
      expect(res.userYearlyLimit).toBeDefined();
      expect(res.userNightlyLimit).toBeDefined();
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0018 - Should update a nighttimestart and end for multiple limit types', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const pixChangeLimitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    const pixSendLimitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXSEND' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: pixChangeLimitType.id,
      nighttimeStart: '20:00',
      nighttimeEnd: '06:00',
    });

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: pixSendLimitType.id,
      nighttimeStart: '22:00',
      nighttimeEnd: '06:00',
    });

    const newUserLimits = new UserLimitEntity({
      nighttimeEnd: '06:00',
      nighttimeStart: '22:00',
    });

    const limitTypes = [pixChangeLimitType, pixSendLimitType];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBeDefined();
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
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('22:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0019 - Should throw a MaxAmountLimitExceededException if userMaxAmountLimit is biggest than maxAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmount: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmount: 10100,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MaxAmountLimitExceededException);
  });

  it('TC0020 - Should throw a MinAmountLimitBelowException if userMinAmount is smaller than minAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      minAmount: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmount: 90,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MinAmountLimitBelowException);
  });

  it('TC0021 - Should throw a MaxAmountNightlyLimitExceededException if userMaxAmountNightlyLimit is biggest than maxAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmountNightly: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmountNightly: 10100,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MaxAmountNightlyLimitExceededException);
  });

  it('TC0022 - Should throw a MinAmountNightlyLimitBelowException if userMinAmountNightly is smaller than minAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      minAmountNightly: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmountNightly: 90,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MinAmountNightlyLimitBelowException);
  });

  it('TC0023 - Should update a userMaxAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmount: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmount: 499,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
      expect(res.nightlyLimit).toBeDefined();
      expect(res.dailyLimit).toBeDefined();
      expect(res.monthlyLimit).toBeDefined();
      expect(res.yearlyLimit).toBeDefined();
      expect(res.maxAmount).toBeDefined();
      expect(res.minAmount).toBeDefined();
      expect(res.maxAmountNightly).toBeDefined();
      expect(res.minAmountNightly).toBeDefined();
      expect(res.userMaxAmount).toBe(499);
      expect(res.userMinAmount).toBeDefined();
      expect(res.userMaxAmountNightly).toBeDefined();
      expect(res.userMinAmountNightly).toBeDefined();
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userMonthlyLimit).toBeDefined();
      expect(res.userYearlyLimit).toBeDefined();
      expect(res.userNightlyLimit).toBeDefined();
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0024 - Should update a userMaxAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmountNightly: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmountNightly: 499,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userMaxAmountNightly).toBe(499);
      expect(res.userMinAmountNightly).toBeDefined();
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userMonthlyLimit).toBeDefined();
      expect(res.userYearlyLimit).toBeDefined();
      expect(res.userNightlyLimit).toBeDefined();
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0025 - Should update a userMinAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      minAmount: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmount: 1001,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userMonthlyLimit).toBeDefined();
      expect(res.userYearlyLimit).toBeDefined();
      expect(res.userNightlyLimit).toBeDefined();
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0026 - Should update a userMinAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXWITHDRAWAL' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      minAmountNightly: 1000,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmountNightly: 1001,
    });

    const limitTypes = [limitType.get()];

    const result = await executeUseCase(user, limitTypes, newUserLimits);

    expect(result).toBeDefined();
    result.forEach((res) => {
      expect(res.id).toBeDefined();
      expect(res.user.id).toBe(user.id);
      expect(res.limitType.id).toBe(limitType.id);
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
      expect(res.userDailyLimit).toBeDefined();
      expect(res.userMonthlyLimit).toBeDefined();
      expect(res.userYearlyLimit).toBeDefined();
      expect(res.userNightlyLimit).toBeDefined();
      expect(res.nighttimeEnd).toBeDefined();
      expect(res.nighttimeStart).toBeDefined();
      expect(res.nighttimeStart).toBe('20:00');
      expect(res.nighttimeEnd).toBe('06:00');
    });
  });

  it('TC0027 - Should throw a MaxAmountLimitExceededException if userMinAmountLimit is biggest than maxAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmount: 200,
      minAmount: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmount: 250,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MaxAmountLimitExceededException);
  });

  it('TC0028 - Should throw a MaxAmountLimitExceededException if userMinAmountLimit is biggest than userMaxAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmount: 200,
      userMaxAmount: 150,
      minAmount: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmount: 160,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MaxAmountLimitExceededException);
  });

  it('TC0029 - Should throw a MinAmountLimitBelowException if userMaxAmount is smaller than minAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmount: 200,
      minAmount: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmount: 90,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MinAmountLimitBelowException);
  });

  it('TC0030 - Should throw a MinAmountLimitBelowException if userMaxAmount is smaller than userMinAmount', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmount: 200,
      minAmount: 100,
      userMinAmount: 150,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmount: 110,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MinAmountLimitBelowException);
  });

  it('TC0031 - Should throw a MaxAmountLimitExceededException if userMinAmountNightlyLimit is biggest than maxAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmountNightly: 200,
      minAmountNightly: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmountNightly: 250,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MaxAmountLimitExceededException);
  });

  it('TC0032 - Should throw a MaxAmountLimitExceededException if userMinAmountNighltyLimit is biggest than userMaxAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmountNightly: 200,
      userMaxAmountNightly: 150,
      minAmountNightly: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMinAmountNightly: 160,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MaxAmountLimitExceededException);
  });

  it('TC0033 - Should throw a MinAmountLimitBelowException if userMaxAmountNightly is smaller than minAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmountNightly: 200,
      minAmountNightly: 100,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmountNightly: 90,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MinAmountLimitBelowException);
  });

  it('TC0034 - Should throw a MinAmountLimitBelowException if userMaxAmountNightly is smaller than userMinAmountNightly', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
      { tag: 'PIXCHANGE' },
    );

    await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
      limitTypeId: limitType.id,
      maxAmountNightly: 200,
      minAmountNightly: 100,
      userMinAmountNightly: 150,
    });

    const newUserLimits = new UserLimitEntity({
      userMaxAmountNightly: 110,
    });

    const limitTypes = [limitType.get()];

    await expect(
      executeUseCase(user, limitTypes, newUserLimits),
    ).rejects.toThrow(MinAmountLimitBelowException);
  });

  it('TC0035 - Should throw DataException when global limit does not exists', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);

    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    const newUserLimits = new UserLimitEntity({
      nighttimeStart: '23:00',
      nighttimeEnd: '22:00',
    });

    await expect(
      executeUseCase(user, [limitType], newUserLimits),
    ).rejects.toThrow(DataException);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
