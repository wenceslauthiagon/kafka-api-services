import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common/test';
import { UserRepository } from '@zro/users/domain';
import {
  UpdateUserPropsMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { UpdateUserPropsRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('UserController', () => {
  let module: TestingModule;
  let controller: UpdateUserPropsMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<UpdateUserPropsMicroserviceController>(
      UpdateUserPropsMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  describe('UpdateUserProps', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update user props successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const message: UpdateUserPropsRequest = {
          uuid: user.uuid,
          propKey: 'testKey',
          propValue: 'test value',
        };

        const result = await controller.execute(
          userRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.propKey).toBe('testKey');
        expect(result.value.propValue).toBe('test value');
        expect(result.value.uuid).toBe(user.uuid);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
