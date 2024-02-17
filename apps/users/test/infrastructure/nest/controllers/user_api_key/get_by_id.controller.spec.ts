import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  GetUserApiKeyByIdMicroserviceController as Controller,
  UserApiKeyDatabaseRepository,
  UserApiKeyModel,
} from '@zro/users/infrastructure';
import { UserApiKeyFactory } from '@zro/test/users/config';
import { GetUserApiKeyByIdRequest } from '@zro/users/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('GetUserApiKeyByIdMicroserviceController', () => {
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

  describe('GetUserApiKeyById', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get by id successfully', async () => {
        const { id } = await UserApiKeyFactory.create<UserApiKeyModel>(
          UserApiKeyModel.name,
        );

        const message: GetUserApiKeyByIdRequest = {
          id,
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
