import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import {
  UserForgotPasswordRepository,
  UserRepository,
} from '@zro/users/domain';
import {
  UpdateUserPinMicroserviceController,
  UserDatabaseRepository,
  UserForgotPasswordDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import {
  UpdateUserPinRequest,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';

describe('UserController', () => {
  let module: TestingModule;
  let controller: UpdateUserPinMicroserviceController;
  let userRepository: UserRepository;
  let userForgotPasswordRepository: UserForgotPasswordRepository;

  const eventEmitter: UserEventEmitterControllerInterface =
    createMock<UserEventEmitterControllerInterface>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<UpdateUserPinMicroserviceController>(
      UpdateUserPinMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
    userForgotPasswordRepository = new UserForgotPasswordDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('UpdateUserPin', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should update user pin successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const message: UpdateUserPinRequest = {
          uuid: user.uuid,
          newPin: '1234',
        };

        const result = await controller.execute(
          userRepository,
          userForgotPasswordRepository,
          eventEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.uuid).toBe(user.uuid);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
