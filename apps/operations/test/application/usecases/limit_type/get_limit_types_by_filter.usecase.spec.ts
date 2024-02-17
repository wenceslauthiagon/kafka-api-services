import { Sequelize } from 'sequelize';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DATABASE_PROVIDER,
  DatabaseModule,
  MissingDataException,
  Pagination,
  PaginationEntity,
  defaultLogger as logger,
} from '@zro/common';
import { LimitTypeFilter } from '@zro/operations/domain';
import { GetLimitTypesByFilterUseCase as UseCase } from '@zro/operations/application';
import {
  CurrencyModel,
  UserLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
  GlobalLimitModel,
  LimitTypeDatabaseRepository,
} from '@zro/operations/infrastructure';
import {
  LimitTypeFactory,
  TransactionTypeFactory,
} from '@zro/test/operations/config';

describe('Testing operation get limits types by filter', () => {
  let module: TestingModule;
  let sequelize: Sequelize;

  const executeUseCase = async (
    filter: LimitTypeFilter,
    pagination: Pagination,
  ) => {
    const transaction = await sequelize.transaction();

    try {
      const limitTypeDatabaseRepository = new LimitTypeDatabaseRepository();

      const userLimitUseCase = new UseCase(logger, limitTypeDatabaseRepository);

      const operation = await userLimitUseCase.execute(filter, pagination);

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

  describe('With invalid parameters', () => {
    it('TC0001 - Should not be able to get limits without wrong pagination params', async () => {
      const filter: LimitTypeFilter = {};
      const pagination = new PaginationEntity();

      const tests = [
        () => executeUseCase(null, null),
        () => executeUseCase(filter, null),
        () => executeUseCase(null, pagination),
      ];

      for (const test of tests) {
        await expect(test).rejects.toThrow(MissingDataException);
      }
    });
  });

  describe('With valid parameters', () => {
    it('TC0002 - Should get limit types by transaction type', async () => {
      const limitTypes = await LimitTypeFactory.createMany<LimitTypeModel>(
        LimitTypeModel.name,
        2,
      );

      const transactionType =
        await TransactionTypeFactory.create<TransactionTypeModel>(
          TransactionTypeModel.name,
          { limitType: limitTypes[0] },
        );

      const filter: LimitTypeFilter = {
        transactionTypeTag: transactionType.tag,
      };

      const pagination = new PaginationEntity();

      const result = await executeUseCase(filter, pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.tag).toBeDefined();
        expect(res.transactionTypes).toBeDefined();
        expect(res.transactionTypes[0].id).toBe(transactionType.id);
        expect(res.currency).toBeDefined();
        expect(res.periodStart).toBeDefined();
        expect(res.check).toBeDefined();
      });
    });

    it('TC0003 - Should get all limit types', async () => {
      await LimitTypeFactory.createMany<LimitTypeModel>(LimitTypeModel.name, 5);

      const filter: LimitTypeFilter = {};

      const pagination = new PaginationEntity();

      const result = await executeUseCase(filter, pagination);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.page).toBe(pagination.page);
      expect(result.pageSize).toBe(pagination.pageSize);
      expect(result.total).toBeDefined();
      expect(result.pageTotal).toBe(
        Math.ceil(result.total / pagination.pageSize),
      );
      result.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.tag).toBeDefined();
        expect(res.periodStart).toBeDefined();
        expect(res.check).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
