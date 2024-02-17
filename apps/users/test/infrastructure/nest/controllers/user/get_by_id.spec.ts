import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common/test';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByIdMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetUserByIdRequest } from '@zro/users/interface';

describe('UserController', () => {
  let module: TestingModule;
  let controller: GetUserByIdMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetUserByIdMicroserviceController>(
      GetUserByIdMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  describe('GetUserById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const message: GetUserByIdRequest = {
          id: user.id,
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
        expect(result.value.uuid).toBe(user.uuid);
        expect(result.value.document).toBe(user.document);
        expect(result.value.fullName).toBe(user.fullName);
        expect(result.value.phoneNumber).toBe(user.phoneNumber);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
