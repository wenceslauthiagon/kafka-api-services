import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, RedisKey, RedisService } from '@zro/common';
import {
  JdpiAccountType,
  JdpiPaymentPriorityLevelType,
  JdpiPaymentPriorityType,
  JdpiPaymentType,
  JdpiPersonType,
} from '@zro/jdpi/domain';
import { NotifyCreditValidationEntity } from '@zro/api-jdpi/domain';
import { UserEntity } from '@zro/users/domain';
import {
  HandleNotifyCreditValidationJdpiEventRequest,
  NotifyCreditValidationEventEmitterControllerInterface,
  NotifyCreditValidationEventType,
} from '@zro/api-jdpi/interface';
import {
  NotifyCreditValidationNestObserver,
  PixPaymentServiceKafka,
  UserServiceKafka,
} from '@zro/api-jdpi/infrastructure';
import { AppModule } from '@zro/api-jdpi/infrastructure/nest/modules/app.module';
import { NotifyCreditValidationFactory } from '@zro/test/api-jdpi/config';
import { UserFactory } from '@zro/test/users/config';

describe('NotifyCreditValidationNestObserver', () => {
  let module: TestingModule;
  let controller: NotifyCreditValidationNestObserver;

  const serviceEventEmitter: NotifyCreditValidationEventEmitterControllerInterface =
    createMock<NotifyCreditValidationEventEmitterControllerInterface>();
  const serviceEventEmitterEvent: jest.Mock = On(serviceEventEmitter).get(
    method((mock) => mock.emitValidationEvent),
  );

  const redisService: RedisService = createMock<RedisService>();
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByAccountNumberAndStatusIsFinished),
  );

  const paymentService: PixPaymentServiceKafka =
    createMock<PixPaymentServiceKafka>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();

    controller = module.get<NotifyCreditValidationNestObserver>(
      NotifyCreditValidationNestObserver,
    );
  });

  beforeEach(() => jest.resetAllMocks());

  describe('HandleNotifyCreditValidationEvent', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should validate notify credit successfully.', async () => {
        const data =
          await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
            NotifyCreditValidationEntity.name,
            { groupId: faker.datatype.uuid() },
          );

        const user = UserFactory.create<UserEntity>(UserEntity.name, {
          document: data.clientDocument,
          active: true,
        });

        const streamNotifyCreditValidationKey: RedisKey = {
          key: data.id,
          data: null,
          ttl: 1,
        };

        mockGetRedisService.mockResolvedValueOnce(
          streamNotifyCreditValidationKey,
        );
        mockGetOnboardingService.mockResolvedValue({});
        mockGetUserByUuidService.mockResolvedValue(user);

        const message: HandleNotifyCreditValidationJdpiEventRequest = {
          id: data.id,
          initiationType: JdpiPaymentType.KEY,
          paymentPriorityType: JdpiPaymentPriorityType.NOT_PRIORITY,
          paymentPriorityLevelType:
            JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT,
          finalityType: data.finalityType,
          thirdPartIspb: data.thirdPartIspb,
          thirdPartPersonType: JdpiPersonType.NATURAL_PERSON,
          thirdPartDocument: data.thirdPartDocument,
          thirdPartName: data.thirdPartName,
          thirdPartAccountType: JdpiAccountType.CACC,
          thirdPartAccountNumber: data.thirdPartAccountNumber,
          clientIspb: '26264220',
          clientPersonType: JdpiPersonType.LEGAL_PERSON,
          clientDocument: data.clientDocument,
          clientAccountType: JdpiAccountType.CACC,
          clientAccountNumber: data.clientAccountNumber,
          amount: data.amount,
          groupId: data.groupId,
        };

        await controller.execute(
          message,
          serviceEventEmitter,
          userService,
          paymentService,
          logger,
        );

        expect(serviceEventEmitterEvent).toHaveBeenCalledTimes(1);
        expect(serviceEventEmitterEvent.mock.calls[0][0]).toBe(
          NotifyCreditValidationEventType.PENDING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not validate notify credit when client info is invalid.', async () => {
        const data =
          await NotifyCreditValidationFactory.create<NotifyCreditValidationEntity>(
            NotifyCreditValidationEntity.name,
            { groupId: faker.datatype.uuid() },
          );

        const message: HandleNotifyCreditValidationJdpiEventRequest = {
          id: data.id,
          initiationType: JdpiPaymentType.KEY,
          paymentPriorityType: JdpiPaymentPriorityType.NOT_PRIORITY,
          paymentPriorityLevelType:
            JdpiPaymentPriorityLevelType.PRIORITY_PAYMENT,
          finalityType: data.finalityType,
          thirdPartIspb: data.thirdPartIspb,
          thirdPartPersonType: JdpiPersonType.NATURAL_PERSON,
          thirdPartDocument: data.thirdPartDocument,
          thirdPartName: data.thirdPartName,
          thirdPartAccountType: JdpiAccountType.CACC,
          thirdPartAccountNumber: data.thirdPartAccountNumber,
          clientIspb: 'invalid',
          clientPersonType: JdpiPersonType.LEGAL_PERSON,
          clientDocument: data.clientDocument,
          clientAccountType: JdpiAccountType.CACC,
          clientAccountNumber: data.clientAccountNumber,
          amount: data.amount,
          groupId: data.groupId,
        };

        await controller.execute(
          message,
          serviceEventEmitter,
          userService,
          paymentService,
          logger,
        );

        expect(serviceEventEmitterEvent).toHaveBeenCalledTimes(1);
        expect(serviceEventEmitterEvent.mock.calls[0][0]).toBe(
          NotifyCreditValidationEventType.PENDING,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
