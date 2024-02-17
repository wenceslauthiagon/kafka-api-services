import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByDocumentMicroserviceController,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { GetUserByDocumentRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('UserController', () => {
  let module: TestingModule;
  let controller: GetUserByDocumentMicroserviceController;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<GetUserByDocumentMicroserviceController>(
      GetUserByDocumentMicroserviceController,
    );
    userRepository = new UserDatabaseRepository();
  });

  describe('GetUserByCpf', () => {
    describe('With valid parameters', () => {
      it('TC0003 - Should get successfully', async () => {
        const user = await UserFactory.create<UserModel>(UserModel.name);

        const message: GetUserByDocumentRequest = {
          document: user.document,
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
