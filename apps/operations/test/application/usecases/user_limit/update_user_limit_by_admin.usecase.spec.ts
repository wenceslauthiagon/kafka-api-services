import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  DatabaseModule,
  DATABASE_PROVIDER,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { UserLimit, UserLimitEntity } from '@zro/operations/domain';
import {
  DailyLimitAboveMonthlyException,
  DailyLimitUnderMaxAmountException,
  MaxAmountLimitAboveDailyException,
  MaxAmountLimitUnderMinAmountException,
  MaxAmountNightlyLimitAboveNightlyException,
  MaxAmountNightlyLimitUnderMinAmountNightlyException,
  MinAmountLimitAboveMaxAmountException,
  MinAmountLimitUnderZeroException,
  MinAmountNightlyLimitAboveMaxAmountException,
  MinAmountNightlyLimitUnderZeroException,
  MonthlyLimitAboveYearlyException,
  MonthlyLimitUnderDailyException,
  NightlyLimitAboveDailyException,
  NightlyLimitUnderMaxAmountNightlyException,
  UpdateUserLimitByAdminUseCase,
  UserLimitEventEmitter,
  UserLimitNotFoundException,
  YearlyLimitUnderMonthlyException,
} from '@zro/operations/application';
import {
  CurrencyModel,
  UserLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
  GlobalLimitModel,
  UserLimitDatabaseRepository,
} from '@zro/operations/infrastructure';
import { UserLimitFactory } from '@zro/test/operations/config';

describe('Testing operation change limits user by admin', () => {
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
    userLimit: UserLimit,
    newUserLimit: UserLimit,
  ) => {
    const transaction = await sequelize.transaction();

    try {
      const userLimitDatabaseRepository = new UserLimitDatabaseRepository();

      const { userLimitEventEmitter } = mockUserLimitEventEmitter();

      const userLimitByAdminUseCase = new UpdateUserLimitByAdminUseCase(
        logger,
        userLimitDatabaseRepository,
        userLimitEventEmitter,
      );

      const operation = await userLimitByAdminUseCase.execute(
        userLimit,
        newUserLimit,
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

  it('TC0001 - Should throw MissingDataException if userLimit is not passed', async () => {
    await expect(executeUseCase(null, null)).rejects.toThrow(
      MissingDataException,
    );
  });

  it('TC0002 - Should throw UserLimitNotFoundException if userLimit not exists', async () => {
    const userLimit = await UserLimitFactory.create<UserLimitEntity>(
      UserLimitEntity.name,
    );

    await expect(executeUseCase(userLimit, null)).rejects.toThrow(
      UserLimitNotFoundException,
    );
  });

  it('TC0003 - Yearly - Should throw YearlyLimitUnderMonthly if new yearly limit is under monthly limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ yearlyLimit: 900 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      YearlyLimitUnderMonthlyException,
    );
  });

  it('TC0004 - Monthly - Should throw MonthlyLimitAboveYearly if new monthly limit is above yearly limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ monthlyLimit: 13000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MonthlyLimitAboveYearlyException,
    );
  });

  it('TC0005 - Monthly - Should throw MonthlyLimitUnderDaily if new monthly limit is under daily limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        dailyLimit: 10,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ monthlyLimit: 9 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MonthlyLimitUnderDailyException,
    );
  });

  it('TC0006 - Daily - Should throw DailyLimitAboveMonthly if new daily limit is above monthly limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ dailyLimit: 2000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      DailyLimitAboveMonthlyException,
    );
  });

  it('TC0007 - Daily - Should throw DailyLimitUnderMaxAmount if new daily limit is under max amount', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        maxAmount: 100,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ dailyLimit: 90 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      DailyLimitUnderMaxAmountException,
    );
  });

  it('TC0008 - Nightly - Should throw NightlyLimitAboveDaily if new nightly limit is above daily limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        dailyLimit: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ nightlyLimit: 2000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      NightlyLimitAboveDailyException,
    );
  });

  it('TC0009 - Nightly - Should throw NightlyLimitUnderMaxAmountNightly if new nightly limit is under max amount nightly', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        maxAmountNightly: 100,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ nightlyLimit: 90 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      NightlyLimitUnderMaxAmountNightlyException,
    );
  });

  it('TC0010 - MaxAmount - Should throw MaxAmountLimitAboveDaily if new max amount is above daily limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        dailyLimit: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ maxAmount: 2000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MaxAmountLimitAboveDailyException,
    );
  });

  it('TC0011 - MaxAmount - Should throw MaxAmountLimitUnderMinAmount if new max amount is under min amount', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        minAmount: 100,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ maxAmount: 90 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MaxAmountLimitUnderMinAmountException,
    );
  });

  it('TC0012 - MinAmount - Should throw MinAmountLimitAboveMaxAmount if new min amount is above max amount', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        maxAmount: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ minAmount: 2000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MinAmountLimitAboveMaxAmountException,
    );
  });

  it('TC0013 - MinAmount - Should throw MinAmountLimitUnderZero if new min amount is under zero', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        maxAmount: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ minAmount: -10 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MinAmountLimitUnderZeroException,
    );
  });

  it('TC0014 - MaxAmountNightly - Should throw MaxAmountNighltyLimitAboveNightlyLimit if new max amount nightly is above nightly limit', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        nightlyLimit: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ maxAmountNightly: 2000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MaxAmountNightlyLimitAboveNightlyException,
    );
  });

  it('TC0015 - MaxAmountNightly - Should throw MaxAmountNighltyLimitUnderMinAmountNightly if new max amount nightly is under min amount nightly', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        nightlyLimit: 1000,
        minAmountNightly: 100,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ maxAmountNightly: 90 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MaxAmountNightlyLimitUnderMinAmountNightlyException,
    );
  });

  it('TC0016 - MinAmountNightly - Should throw MinAmountNightlyLimitAboveMaxAmountNightly if new min amount nightly is above max amount nightly', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        maxAmountNightly: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ minAmountNightly: 2000 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MinAmountNightlyLimitAboveMaxAmountException,
    );
  });

  it('TC0017 - MinAmountNightly - Should throw MinAmountNightlyLimitUnderZero if new min amount nightly is under zero', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        monthlyLimit: 1000,
        maxAmountNightly: 1000,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({ minAmountNightly: -10 });

    await expect(executeUseCase(userLimit, newUserLimit)).rejects.toThrow(
      MinAmountNightlyLimitUnderZeroException,
    );
  });

  it('TC0018 - Should update compliance defined user limits', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
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

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({
      yearlyLimit: 13000,
      monthlyLimit: 1100,
      dailyLimit: 700,
      nightlyLimit: 500,
      maxAmount: 500,
      minAmount: 1,
      maxAmountNightly: 100,
      minAmountNightly: 1,
    });

    const result = await executeUseCase(userLimit, newUserLimit);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.user.id).toBeDefined();
    expect(result.limitType.id).toBeDefined();
    expect(result.nightlyLimit).toBe(500);
    expect(result.dailyLimit).toBe(700);
    expect(result.monthlyLimit).toBe(1100);
    expect(result.yearlyLimit).toBe(13000);
    expect(result.maxAmount).toBe(500);
    expect(result.minAmount).toBe(1);
    expect(result.maxAmountNightly).toBe(100);
    expect(result.minAmountNightly).toBe(1);
    expect(result.userMaxAmount).toBeDefined();
    expect(result.userMinAmount).toBeDefined();
    expect(result.userMaxAmountNightly).toBeDefined();
    expect(result.userMinAmountNightly).toBeDefined();
    expect(result.userDailyLimit).toBeDefined();
    expect(result.userDailyLimit).toBeDefined();
    expect(result.userMonthlyLimit).toBeDefined();
    expect(result.userYearlyLimit).toBeDefined();
    expect(result.userNightlyLimit).toBeDefined();
    expect(result.nighttimeEnd).toBeDefined();
    expect(result.nighttimeStart).toBeDefined();
    expect(result.nighttimeStart).toBeDefined();
    expect(result.nighttimeEnd).toBeDefined();
  });

  it('TC0019 - Should reduce user defined limits if compliance define minor limits', async () => {
    const userLimitInDatabase = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        yearlyLimit: 12000,
        userYearlyLimit: 12000,
        monthlyLimit: 10000,
        userMonthlyLimit: 90000,
        dailyLimit: 1500,
        userDailyLimit: 1400,
        nightlyLimit: 600,
        userNightlyLimit: 600,
        maxAmount: 200,
        userMaxAmount: 200,
        minAmount: 2,
        userMinAmount: 2,
        maxAmountNightly: 200,
        userMaxAmountNightly: 200,
        minAmountNightly: 2,
        userMinAmountNightly: 2,
      },
    );

    const userLimit = new UserLimitEntity({ id: userLimitInDatabase.id });

    const newUserLimit = new UserLimitEntity({
      yearlyLimit: 11000,
      monthlyLimit: 1100,
      dailyLimit: 700,
      nightlyLimit: 500,
      maxAmount: 100,
      minAmount: 3,
      maxAmountNightly: 100,
      minAmountNightly: 3,
    });

    const result = await executeUseCase(userLimit, newUserLimit);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.user.id).toBeDefined();
    expect(result.limitType.id).toBeDefined();
    expect(result.yearlyLimit).toBe(11000);
    expect(result.userYearlyLimit).toBe(11000);
    expect(result.monthlyLimit).toBe(1100);
    expect(result.userMonthlyLimit).toBe(1100);
    expect(result.dailyLimit).toBe(700);
    expect(result.userDailyLimit).toBe(700);
    expect(result.nightlyLimit).toBe(500);
    expect(result.userNightlyLimit).toBe(500);
    expect(result.maxAmount).toBe(100);
    expect(result.userMaxAmount).toBe(100);
    expect(result.minAmount).toBe(3);
    expect(result.userMinAmount).toBe(3);
    expect(result.maxAmountNightly).toBe(100);
    expect(result.userMaxAmountNightly).toBe(100);
    expect(result.minAmountNightly).toBe(3);
    expect(result.userMinAmountNightly).toBe(3);
    expect(result.nighttimeEnd).toBeDefined();
    expect(result.nighttimeStart).toBeDefined();
    expect(result.nighttimeStart).toBeDefined();
    expect(result.nighttimeEnd).toBeDefined();
  });
});
