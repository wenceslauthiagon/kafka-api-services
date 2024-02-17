import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import { UserRepository } from '@zro/users/domain';
import {
  AddUserPinMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  AddUserPinRequest,
  UserEventEmitterControllerInterface,
} from '@zro/users/interface';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';

describe('UserController', () => {
  let module: TestingModule;
  let controller: AddUserPinMicroserviceController;
  let userRepository: UserRepository;

  const eventEmitter: UserEventEmitterControllerInterface =
    createMock<UserEventEmitterControllerInterface>();

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<AddUserPinMicroserviceController>(
      AddUserPinMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('AddUserPin', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should add user pin successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name, {
          pinHasCreated: false,
        });

        const message: AddUserPinRequest = {
          uuid: user.uuid,
          pin: '1234',
        };

        const result = await controller.execute(
          userRepository,
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
