import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { createMock } from 'ts-auto-mock';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  UserWithdrawSettingRequestRepository,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
} from '@zro/compliance/domain';
import {
  GetUserWithdrawSettingRequestByUserAndIdMicroserviceController as Controller,
  UserWithdrawSettingRequestDatabaseRepository,
  UserWithdrawSettingRequestModel,
} from '@zro/compliance/infrastructure';
import { AppModule } from '@zro/compliance/infrastructure/nest/modules/app.module';
import { GetUserWithdrawSettingRequestByUserAndIdRequest } from '@zro/compliance/interface';
import { UserWithdrawSettingRequestFactory } from '@zro/test/compliance/config';

describe('GetUserWithdrawSettingRequestByUserAndIdMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userWithdrawSettingRequestRepository: UserWithdrawSettingRequestRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userWithdrawSettingRequestRepository =
      new UserWithdrawSettingRequestDatabaseRepository();
  });

  describe('GetUserWithdrawSettingRequestByUserAndId', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not get if mising params', async () => {
        const message: GetUserWithdrawSettingRequestByUserAndIdRequest = {
          id: null,
          userId: null,
        };

        const test = () =>
          controller.execute(
            userWithdrawSettingRequestRepository,
            logger,
            message,
            ctx,
          );

        await expect(test).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should get successfully', async () => {
        const userWithdrawSetting =
          await UserWithdrawSettingRequestFactory.create<UserWithdrawSettingRequestModel>(
            UserWithdrawSettingRequestModel.name,
            {
              state: UserWithdrawSettingRequestState.OPEN,
              type: WithdrawSettingType.BALANCE,
            },
          );

        const message: GetUserWithdrawSettingRequestByUserAndIdRequest = {
          id: userWithdrawSetting.id,
          userId: userWithdrawSetting.userId,
        };

        const result = await controller.execute(
          userWithdrawSettingRequestRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(userWithdrawSetting.id);
        expect(result.value.type).toBe(userWithdrawSetting.type);
        expect(result.value.balance).toBe(userWithdrawSetting.balance);
        expect(result.value.state).toBe(UserWithdrawSettingRequestState.OPEN);
        expect(result.value.analysisResult).toBeNull();
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
