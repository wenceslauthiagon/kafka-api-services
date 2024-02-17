import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserWalletRepository } from '@zro/operations/domain';
import { UserService } from '@zro/operations/application';
import {
  GetAllUserWalletByUserAndWalletMicroserviceController as Controller,
  UserWalletDatabaseRepository,
  UserWalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { GetAllUserWalletByUserAndWalletRequest } from '@zro/operations/interface';
import { UserWalletFactory } from '@zro/test/operations/config';

describe('GetAllUserWalletByUserAndWalletMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWalletRepository: UserWalletRepository;

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUuidService = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWalletRepository = new UserWalletDatabaseRepository();
  });

  describe('UserWalletByUserId', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get user wallet permissions successfully', async () => {
        const userCreated = await UserWalletFactory.create<UserWalletModel>(
          UserWalletModel.name,
        );

        const message: GetAllUserWalletByUserAndWalletRequest = {
          userId: userCreated.userId,
          walletId: userCreated.walletId,
        };

        const userUuid = faker.datatype.uuid();
        const userName = faker.name.firstName();

        mockGetUserByUuidService.mockResolvedValue({
          uuid: userUuid,
          name: userName,
        });

        const result = await controller.execute(
          userWalletRepository,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value.total).toBe(1);
        expect(result.value).toBeDefined();
        result.value.data.forEach((item) => {
          expect(item.id).toBe(userUuid);
          expect(item.name).toBe(userName);
        });
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not return user if id is null', async () => {
        const message: GetAllUserWalletByUserAndWalletRequest = {
          userId: null,
          walletId: null,
        };

        const testScript = () =>
          controller.execute(
            userWalletRepository,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
