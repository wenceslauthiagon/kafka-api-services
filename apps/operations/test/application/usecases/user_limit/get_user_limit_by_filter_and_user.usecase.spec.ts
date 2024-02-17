import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import {
  DatabaseModule,
  MissingDataException,
  DATABASE_PROVIDER,
  defaultLogger as logger,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { GetUserLimitByIdAndUser } from '@zro/operations/application';
import {
  CurrencyModel,
  UserLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
  GlobalLimitModel,
  UserLimitDatabaseRepository,
} from '@zro/operations/infrastructure';
import { UserLimitFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('Testing operation get limit user by id and user', () => {
  let module: TestingModule;
  let sequelize: Sequelize;

  const executeUseCase = async (id: string, user: User) => {
    const transaction = await sequelize.transaction();

    try {
      const userLimitDatabaseRepository = new UserLimitDatabaseRepository();

      const userLimitUseCase = new GetUserLimitByIdAndUser(
        logger,
        userLimitDatabaseRepository,
      );

      const operation = await userLimitUseCase.execute(id, user);

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

  it('TC0001 - Should throw a missing data exception if missing filter or pagination', async () => {
    const tests = [
      () => executeUseCase(null, null),
      () => executeUseCase('x', null),
      () => executeUseCase(null, new UserEntity({ id: 1 })),
    ];

    for (const test of tests) {
      await expect(test).rejects.toThrow(MissingDataException);
    }
  });

  it('TC0002 - Should not get user limit from another user', async () => {
    const userCreated = await UserFactory.create<UserEntity>(UserEntity.name);

    const userLimitCreated = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      {
        userId: userCreated.id,
      },
    );

    const id = userLimitCreated.id;
    const user = new UserEntity({ id: 2 });

    const result = await executeUseCase(id, user);

    expect(result).toBeNull();
  });

  it('TC0003 - Should get user limit by id and user', async () => {
    const userCreated = await UserFactory.create<UserEntity>(UserEntity.name);

    const userLimitCreated = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
      { userId: userCreated.id },
    );

    const id = userLimitCreated.id;
    const user = new UserEntity({ id: userCreated.id });

    const result = await executeUseCase(id, user);

    expect(result).toBeDefined();
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.id).toBe(user.id);
    expect(result.limitType).toBeDefined();
    expect(result.limitType.id).toBeDefined();
    expect(result.nightlyLimit).toBeDefined();
    expect(result.dailyLimit).toBeDefined();
    expect(result.monthlyLimit).toBeDefined();
    expect(result.yearlyLimit).toBeDefined();
    expect(result.maxAmount).toBeDefined();
    expect(result.minAmount).toBeDefined();
    expect(result.maxAmountNightly).toBeDefined();
    expect(result.minAmountNightly).toBeDefined();
    expect(result.userMaxAmount).toBeDefined();
    expect(result.userMinAmount).toBeDefined();
    expect(result.userMaxAmountNightly).toBeDefined();
    expect(result.userMinAmountNightly).toBeDefined();
    expect(result.userDailyLimit).toBeDefined();
    expect(result.userMonthlyLimit).toBeDefined();
    expect(result.userYearlyLimit).toBeDefined();
    expect(result.userNightlyLimit).toBeDefined();
    expect(result.nighttimeEnd).toBeDefined();
    expect(result.nighttimeStart).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
