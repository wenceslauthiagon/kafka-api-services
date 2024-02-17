import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { UserPinAttemptsRepository, UserRepository } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  GetUserPinAttemptByUserMicroserviceController,
  UserDatabaseRepository,
  UserModel,
  UserPinAttemptsDatabaseRepository,
  UserPinAttemptsModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  GetUserPinAttemptsByUserRequest,
  UserPinAttemptsEventEmitterControllerInterface,
} from '@zro/users/interface';
import { UserFactory, UserPinAttemptsFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';

describe('GetUserPinAttemptByUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: GetUserPinAttemptByUserMicroserviceController;

  let userRepository: UserRepository;
  let userPinAttemptsRepository: UserPinAttemptsRepository;

  const userPixAttemptsEventEmitter: UserPinAttemptsEventEmitterControllerInterface =
    createMock<UserPinAttemptsEventEmitterControllerInterface>();
  const mockEmitUserPinAttemptsEvent: jest.Mock = On(
    userPixAttemptsEventEmitter,
  ).get(method((mock) => mock.emitUserPinAttemptsEvent));

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetUserPinAttemptByUserMicroserviceController>(
      GetUserPinAttemptByUserMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
    userPinAttemptsRepository = new UserPinAttemptsDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetUserPinAttemptsByUser', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const userPinAttempts =
          await UserPinAttemptsFactory.create<UserPinAttemptsModel>(
            UserPinAttemptsModel.name,
            { attempts: 5, userId: user.id },
          );

        const message: GetUserPinAttemptsByUserRequest = {
          userId: user.uuid,
        };

        const result = await controller.execute(
          userRepository,
          userPinAttemptsRepository,
          userPixAttemptsEventEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(userPinAttempts.uuid);
        expect(result.value.attempts).toBe(userPinAttempts.attempts);
        expect(result.value.userId).toBe(user.uuid);

        expect(mockEmitUserPinAttemptsEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not get with id not found', async () => {
        const message: GetUserPinAttemptsByUserRequest = {
          userId: uuidV4(),
        };

        await expect(() =>
          controller.execute(
            userRepository,
            userPinAttemptsRepository,
            userPixAttemptsEventEmitter,
            logger,
            message,
            ctx,
          ),
        ).rejects.toThrow(UserNotFoundException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
