import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import {
  DatabaseModule,
  MissingDataException,
  DATABASE_PROVIDER,
  defaultLogger as logger,
} from '@zro/common';
import { UserLimitFilter } from '@zro/operations/domain';
import {
  DataException,
  GetUserLimitsByFilterUseCase as UseCase,
  UserLimitEventEmitter,
} from '@zro/operations/application';
import {
  CurrencyModel,
  UserLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
  GlobalLimitModel,
  GlobalLimitDatabaseRepository,
  LimitTypeDatabaseRepository,
  UserLimitDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  GlobalLimitFactory,
  LimitTypeFactory,
  UserLimitFactory,
} from '@zro/test/operations/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';

describe('Testing operation get limits user by filter', () => {
  let module: TestingModule;
  let sequelize: Sequelize;

  const mockUserLimitEventEmitter = () => {
    const userLimitEventEmitter: UserLimitEventEmitter =
      createMock<UserLimitEventEmitter>();

    const mockCreatedUserLimitEvent: jest.Mock = On(userLimitEventEmitter).get(
      method((mock) => mock.createdUserLimit),
    );

    return { userLimitEventEmitter, mockCreatedUserLimitEvent };
  };

  const executeUseCase = async (filter: UserLimitFilter) => {
    const transaction = await sequelize.transaction();

    try {
      const userLimitDatabaseRepository = new UserLimitDatabaseRepository();
      const globalLimitDatabaseRepository = new GlobalLimitDatabaseRepository();
      const limitTypeDatabaseRepository = new LimitTypeDatabaseRepository();

      const { userLimitEventEmitter } = mockUserLimitEventEmitter();

      const userLimitUseCase = new UseCase(
        logger,
        userLimitDatabaseRepository,
        globalLimitDatabaseRepository,
        limitTypeDatabaseRepository,
        userLimitEventEmitter,
      );

      const operation = await userLimitUseCase.execute(filter);

      await transaction.commit();

      return operation;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  beforeEach(() => jest.resetAllMocks());

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
          UserLimitModel,
        ]),
      ],
    }).compile();
    sequelize = module.get(DATABASE_PROVIDER);
  });

  describe('Testing operation get limits user by filter', () => {
    it('TC0001 - Should throw a missing data exception if missing filter or pagination', async () => {
      await expect(executeUseCase(null)).rejects.toThrow(MissingDataException);
    });

    it('TC0002 - Should get user limits by limit type and user', async () => {
      const userId = faker.datatype.number({ min: 1, max: 99999 });
      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );
      const otherLimitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );
      await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
        userId,
        limitTypeId: limitType.id,
      });
      await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
        userId,
        limitTypeId: otherLimitType.id,
      });

      const filter = { userId, limitTypeId: limitType.id };
      const result = await executeUseCase(filter);

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user).toBeDefined();
        expect(res.user.id).toBe(userId);
        expect(res.limitType).toBeDefined();
        expect(res.limitType.id).toBe(limitType.id);
        expect(res.limitType.tag).toBeDefined();
        expect(res.limitType.description).toBeDefined();
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
      });
    });

    it('TC0003 - Should create and return a user limit if user limit not exists', async () => {
      const userId = faker.datatype.number({ min: 1, max: 99999 });
      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );
      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
      });

      const filter = { userId, limitTypeId: limitType.id };
      const result = await executeUseCase(filter);

      expect(result).toBeDefined();
      result.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.user).toBeDefined();
        expect(res.user.id).toBe(userId);
        expect(res.limitType).toBeDefined();
        expect(res.limitType.id).toBe(limitType.id);
        expect(res.limitType.tag).toBeDefined();
        expect(res.limitType.description).toBeDefined();
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
      });
    });

    it('TC0004 - Should limitTypeid not exist', async () => {
      const userId = faker.datatype.number({ min: 1, max: 99999 });
      await LimitTypeFactory.create<LimitTypeModel>(LimitTypeModel.name);

      const filter = { userId, limitTypeId: 0 };
      const result = () => executeUseCase(filter);

      await expect(result).rejects.toThrow(DataException);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
