import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common/test';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByUuidMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetUserByUuidRequest } from '@zro/users/interface';

describe('UserController', () => {
  let module: TestingModule;
  let controller: GetUserByUuidMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetUserByUuidMicroserviceController>(
      GetUserByUuidMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  describe('GetUserByUuid', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const message: GetUserByUuidRequest = {
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
