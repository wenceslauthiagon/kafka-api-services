import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  GetUserApiKeyByUserMicroserviceController as Controller,
  UserApiKeyDatabaseRepository,
  UserApiKeyModel,
} from '@zro/users/infrastructure';
import { UserApiKeyFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetUserApiKeyByUserRequest } from '@zro/users/interface';

describe('GetUserApiKeyByUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userApiKeyRepository: UserApiKeyDatabaseRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userApiKeyRepository = new UserApiKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('GetUserApiKeyByUser', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by id successfully', async () => {
        const { userId } = await UserApiKeyFactory.create<UserApiKeyModel>(
          UserApiKeyModel.name,
        );

        const message: GetUserApiKeyByUserRequest = {
          userId,
        };

        const result = await controller.execute(
          userApiKeyRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.hash).toBeDefined();
        expect(result.value.userId).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
