import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { UserLimitEntity } from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CurrencyModel,
  UserLimitModel,
  LimitTypeModel,
  TransactionTypeModel,
} from '@zro/operations/infrastructure';
import {
  LimitTypeFactory,
  UserLimitFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('UserLimitModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          TransactionTypeModel,
          LimitTypeModel,
          UserLimitModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const userLimit = await UserLimitFactory.create<UserLimitModel>(
      UserLimitModel.name,
    );
    expect(userLimit).toBeDefined();
    expect(userLimit.id).toBeDefined();
  });

  it('TC0002 - should create with model', async () => {
    const user = await UserFactory.create<UserEntity>(UserEntity.name);
    const limitType = await LimitTypeFactory.create<LimitTypeModel>(
      LimitTypeModel.name,
    );

    const userLimit: any = new UserLimitEntity({
      user,
      limitType,
      dailyLimit: 10000,
      monthlyLimit: 20000,
      yearlyLimit: 30000,
    });

    userLimit.userId = user.id;

    const createdUserLimit = new UserLimitModel(userLimit);
    await createdUserLimit.save();

    expect(createdUserLimit).toBeDefined();
    expect(createdUserLimit.id).toBeDefined();
    expect(createdUserLimit.userId).toBe(user.id);
    expect(createdUserLimit.limitTypeId).toBe(limitType.id);
  });

  afterAll(async () => {
    await module.close();
  });
});
