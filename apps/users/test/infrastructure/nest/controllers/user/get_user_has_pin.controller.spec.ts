import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common/test';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserHasPinMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { GetUserHasPinRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('UserController', () => {
  let module: TestingModule;
  let controller: GetUserHasPinMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetUserHasPinMicroserviceController>(
      GetUserHasPinMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetUserHasPin', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get user pin has pin successfully when true', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name, {
          pinHasCreated: true,
        });

        const message: GetUserHasPinRequest = {
          uuid: user.uuid,
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
        expect(result.value.hasPin).toBeTruthy();
      });

      it('TC0002 - Should get user pin has pin successfully when false', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name, {
          pinHasCreated: false,
        });

        const message: GetUserHasPinRequest = {
          uuid: user.uuid,
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
        expect(result.value.hasPin).toBeFalsy();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
