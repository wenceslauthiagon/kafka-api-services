import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common/test';
import { UserRepository } from '@zro/users/domain';
import {
  ChangeUserPasswordMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { ChangeUserPasswordRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('UserController', () => {
  let module: TestingModule;
  let controller: ChangeUserPasswordMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<ChangeUserPasswordMicroserviceController>(
      ChangeUserPasswordMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  describe('ChangeUserPassword', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update user password successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);
        const password = '007NoTimeToDi%';

        const message: ChangeUserPasswordRequest = {
          userId: user.uuid,
          password,
        };

        const result = await controller.execute(
          userRepository,
          logger,
          message,
          ctx,
        );

        const userInDatabase = await userRepository.getById(user.id);

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(user.uuid);
        expect(userInDatabase.password).toBe(password);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
