import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { UserRepository } from '@zro/users/domain';
import {
  GetUserByDocumentMicroserviceController as Controller,
  UserDatabaseRepository,
  UserModel,
} from '@zro/users/infrastructure';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetUserByDocumentRequest } from '@zro/users/interface';

describe('UserController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userRepository: UserRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userRepository = new UserDatabaseRepository();
  });

  describe('GetUserByDocument', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get successfully', async () => {
        const { document } = await UserFactory.create<UserModel>(
          UserModel.name,
        );

        const message: GetUserByDocumentRequest = {
          document,
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
        expect(result.value.document).toBe(document);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
