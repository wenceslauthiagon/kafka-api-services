import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserHasPinUseCase,
  UserNotFoundException,
} from '@zro/users/application';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserDatabaseRepository, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';

describe('GetUserHasPinUseCase', () => {
  let module: TestingModule;
  let userRepository: UserRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    userRepository = new UserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  it('TC0001 - Should get user pin when true successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name, {
      pinHasCreated: true,
    });

    const usecase = new GetUserHasPinUseCase(logger, userRepository);

    const result = await usecase.execute(user.uuid);

    expect(result).toBeTruthy();
  });

  it('TC0002 - Should get user pin when false successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name, {
      pinHasCreated: false,
    });

    const usecase = new GetUserHasPinUseCase(logger, userRepository);

    const result = await usecase.execute(user.uuid);

    expect(result).toBeFalsy();
  });

  it('TC0003 - Should not get user pin when user not found successfully', async () => {
    const usecase = new GetUserHasPinUseCase(logger, userRepository);

    const uuid = faker.datatype.uuid();
    const testScript = () => usecase.execute(uuid);

    await expect(testScript).rejects.toThrow(UserNotFoundException);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
