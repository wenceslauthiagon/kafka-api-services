import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByPhoneNumberMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetUserByPhoneNumberRequest } from '@zro/operations/application';

describe('UserController', () => {
  let module: TestingModule;
  let controller: GetUserByPhoneNumberMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetUserByPhoneNumberMicroserviceController>(
      GetUserByPhoneNumberMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  describe('GetUserByPhoneNumber', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const message: GetUserByPhoneNumberRequest = {
          phoneNumber: user.phoneNumber,
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
        expect(result.value.id).toBe(user.id);
        expect(result.value.type).toBe(user.type);
        expect(result.value.uuid).toBe(user.uuid);
        expect(result.value.email).toBe(user.email);
        expect(result.value.phoneNumber).toBe(user.phoneNumber);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
