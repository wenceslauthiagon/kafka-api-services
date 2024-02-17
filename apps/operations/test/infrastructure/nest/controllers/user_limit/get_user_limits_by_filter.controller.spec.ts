import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { defaultLogger as logger } from '@zro/common';
import {
  GlobalLimitRepository,
  LimitTypeRepository,
  UserLimitRepository,
} from '@zro/operations/domain';
import { UserEntity } from '@zro/users/domain';
import {
  GetUserLimitsByFilterMicroserviceController as Controller,
  UserLimitDatabaseRepository,
  LimitTypeModel,
  UserLimitModel,
  GlobalLimitDatabaseRepository,
  LimitTypeDatabaseRepository,
  UserServiceKafka,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  LimitTypeFactory,
  UserLimitFactory,
} from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';
import { KafkaContext } from '@nestjs/microservices';
import {
  GetUserLimitsByFilterRequest,
  UserLimitEventEmitterControllerInterface,
  UserLimitEventType,
} from '@zro/operations/interface';

describe('GetUserLimitsByFilterMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let userLimitRepository: UserLimitRepository;
  let globalLimitRepository: GlobalLimitRepository;
  let limitTypeRepository: LimitTypeRepository;

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const userLimitEventEmitter: UserLimitEventEmitterControllerInterface =
    createMock<UserLimitEventEmitterControllerInterface>();
  const mockEmitUserLimitEvent: jest.Mock = On(userLimitEventEmitter).get(
    method((mock) => mock.emitUserLimitEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    userLimitRepository = new UserLimitDatabaseRepository();
    globalLimitRepository = new GlobalLimitDatabaseRepository();
    limitTypeRepository = new LimitTypeDatabaseRepository();
  });

  describe('GetUserLimitsByFilter', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should get user limits filtered by user and limit type successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const limitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        const otherlimitType = await LimitTypeFactory.create<LimitTypeModel>(
          LimitTypeModel.name,
        );

        await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
          limitTypeId: limitType.id,
          userId: user.id,
        });

        await UserLimitFactory.create<UserLimitModel>(UserLimitModel.name, {
          limitTypeId: otherlimitType.id,
          userId: user.id,
        });

        const message: GetUserLimitsByFilterRequest = {
          userId: user.uuid,
          limitTypeId: limitType.id,
        };

        mockGetUserByUuidService.mockReturnValueOnce({
          id: user.id,
          uuid: user.uuid,
        });

        const result = await controller.execute(
          userLimitRepository,
          globalLimitRepository,
          limitTypeRepository,
          userService,
          userLimitEventEmitter,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockGetUserByUuidService).toHaveBeenCalledWith({
          userId: user.uuid,
        });
        result.value.forEach((res) => {
          expect(res).toBeDefined();
          expect(res.id).toBeDefined();
          expect(res.limitTypeId).toBe(limitType.id);
          expect(res.nightlyLimit).toBeDefined();
          expect(res.dailyLimit).toBeDefined();
          expect(res.monthlyLimit).toBeDefined();
          expect(res.yearlyLimit).toBeDefined();
          expect(res.maxAmount).toBeDefined();
          expect(res.minAmount).toBeDefined();
          expect(res.maxAmountNightly).toBeDefined();
          expect(res.minAmountNightly).toBeDefined();
          expect(res.userMaxAmount).toBeDefined();
          expect(res.userMinAmount).toBeDefined();
          expect(res.userMaxAmountNightly).toBeDefined();
          expect(res.userMinAmountNightly).toBeDefined();
          expect(res.userDailyLimit).toBeDefined();
          expect(res.userMonthlyLimit).toBeDefined();
          expect(res.userYearlyLimit).toBeDefined();
          expect(res.userNightlyLimit).toBeDefined();
          expect(res.nighttimeEnd).toBeDefined();
          expect(res.nighttimeStart).toBeDefined();
        });
        expect(mockEmitUserLimitEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitUserLimitEvent.mock.calls[0][0]).toBe(
          UserLimitEventType.CREATED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
