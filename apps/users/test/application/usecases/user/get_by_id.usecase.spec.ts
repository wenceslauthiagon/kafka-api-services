import { Logger } from 'winston';
import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

import { UserRepository } from '@zro/users/domain';
import { GetUserByIdUseCase } from '@zro/users/application';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserDatabaseRepository, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';

describe('GetUserByIdUseCase', () => {
  let module: TestingModule;
  let logger: Logger;
  let userRepository: UserRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    logger = module.get(WINSTON_MODULE_PROVIDER);
    userRepository = new UserDatabaseRepository();
  });

  it('TC0001 - Should get user successfully', async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);

    const usecase = new GetUserByIdUseCase(logger, userRepository);

    const foundUser = await usecase.execute(user.id);

    expect(foundUser).toBeDefined();
    expect(foundUser.id).toBe(user.id);
    expect(foundUser.uuid).toBe(user.uuid);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
