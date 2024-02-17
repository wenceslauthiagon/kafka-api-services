import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { UserLimitRepository } from '@zro/operations/domain';
import {
  GetUserLimitByIdAndUserMicroserviceController as Controller,
  UserLimitDatabaseRepository,
  UserLimitModel,
  UserServiceKafka,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { UserLimitFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import { GetUserLimitByIdAndUserRequest } from '@zro/operations/interface';

describe('GetUserLimitByIdAndUserMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userLimitRepository: UserLimitRepository;

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userLimitRepository = new UserLimitDatabaseRepository();
  });

  describe('GetUserLimitByIdAndUser', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get user limit by id and user successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const userLimit = await UserLimitFactory.create<UserLimitModel>(
          UserLimitModel.name,
          { userId: user.id },
        );

        const message: GetUserLimitByIdAndUserRequest = {
          id: userLimit.id,
          userId: user.uuid,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
        expect(result).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.limitTypeId).toBeDefined();
        expect(result.value.nightlyLimit).toBeDefined();
        expect(result.value.dailyLimit).toBeDefined();
        expect(result.value.monthlyLimit).toBeDefined();
        expect(result.value.yearlyLimit).toBeDefined();
        expect(result.value.maxAmount).toBeDefined();
        expect(result.value.minAmount).toBeDefined();
        expect(result.value.maxAmountNightly).toBeDefined();
        expect(result.value.minAmountNightly).toBeDefined();
        expect(result.value.userMaxAmount).toBeDefined();
        expect(result.value.userMinAmount).toBeDefined();
        expect(result.value.userMaxAmountNightly).toBeDefined();
        expect(result.value.userMinAmountNightly).toBeDefined();
        expect(result.value.userDailyLimit).toBeDefined();
        expect(result.value.userMonthlyLimit).toBeDefined();
        expect(result.value.userYearlyLimit).toBeDefined();
        expect(result.value.userNightlyLimit).toBeDefined();
        expect(result.value.nighttimeEnd).toBeDefined();
        expect(result.value.nighttimeStart).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
