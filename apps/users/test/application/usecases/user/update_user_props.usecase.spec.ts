import { Test, TestingModule } from '@nestjs/testing';
import { isDeepStrictEqual } from 'util';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import { UpdateUserPropsUseCase } from '@zro/users/application';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserDatabaseRepository, UserModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';

describe('UpdateUserPropsUseCase', () => {
  let module: TestingModule;
  let userRepository: UserRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    userRepository = new UserDatabaseRepository();
  });

  it(`TC0001 - Should update user props successfully, when user's props are null`, async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name);

    const usecase = new UpdateUserPropsUseCase(logger, userRepository);

    const userWithUpdatedProps = await usecase.execute(
      user.uuid,
      'testKey',
      'test value',
    );

    const newProps = { testKey: 'test value' };

    expect(userWithUpdatedProps).toBeDefined();
    expect(isDeepStrictEqual(newProps, userWithUpdatedProps.props)).toBe(true);
  });

  it(`TC0002 - Should update user props successfully, when user's props are NOT null`, async () => {
    const user = await UserFactory.create<UserModel>(UserModel.name, {
      props: { testKey: 'test value' },
    });

    const usecase = new UpdateUserPropsUseCase(logger, userRepository);

    const userWithUpdatedProps = await usecase.execute(
      user.uuid,
      'newKey',
      'new value',
    );

    const newProps = { ...userWithUpdatedProps.props, testKey: 'test value' };

    expect(userWithUpdatedProps).toBeDefined();
    expect(isDeepStrictEqual(newProps, userWithUpdatedProps.props)).toBe(true);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
