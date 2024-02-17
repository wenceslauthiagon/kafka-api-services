import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import { GetUserByUuidUseCase } from '@zro/users/application';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserDatabaseRepository, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';

describe('GetUserByUuidUseCase', () => {
  let module: TestingModule;
  let userRepository: UserRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    userRepository = new UserDatabaseRepository();
  });

  it('TC0001 - Should get user successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);

    const usecase = new GetUserByUuidUseCase(logger, userRepository);

    const foundUser = await usecase.execute(user.uuid);

    expect(foundUser).toBeDefined();
    expect(foundUser.uuid).toBe(user.uuid);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
