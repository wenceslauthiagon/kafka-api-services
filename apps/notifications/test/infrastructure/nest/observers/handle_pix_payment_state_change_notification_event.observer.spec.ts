import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger } from '@zro/common';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { PaymentEntity, PaymentState } from '@zro/pix-payments/domain';
import {
  PaymentStateChangeNotificationNestObserver as Observer,
  BellNotificationDatabaseRepository,
  UserServiceKafka,
} from '@zro/notifications/infrastructure';
import { PaymentFactory } from '@zro/test/pix-payments/config';
import { InvalidDataFormatException } from '@zro/common';
import { UserFactory } from '@zro/test/users/config';
import { UserEntity } from '@zro/users/domain';
import {
  BellNotificationEventEmitterControllerInterface,
  SendPaymentStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import { BellNotificationRepository } from '@zro/notifications/domain';

describe('PaymentStateChangeNotificationNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let bellNotificationRepository: BellNotificationRepository;

  const eventEmitter: BellNotificationEventEmitterControllerInterface =
    createMock<BellNotificationEventEmitterControllerInterface>();
  const mockEmitEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitCreatedEvent),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Observer>(Observer);
    bellNotificationRepository = new BellNotificationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle create a confirmed payment notification successfully', async () => {
      const { id, user, state, value, beneficiaryName } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
          state: PaymentState.CONFIRMED,
          createdAt: new Date(),
        });

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPaymentStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        beneficiaryName,
        value,
      };

      await controller.handleConfirmedPaymentEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle create a canceled payment notification successfully', async () => {
      const { id, user, state, value, beneficiaryName } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
          state: PaymentState.CANCELED,
          createdAt: new Date(),
        });

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPaymentStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        beneficiaryName,
        value,
      };

      await controller.handleConfirmedPaymentEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should handle create a error payment notification successfully', async () => {
      const { id, user, state, value, beneficiaryName } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
          state: PaymentState.ERROR,
          createdAt: new Date(),
        });

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPaymentStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        beneficiaryName,
        value,
      };

      await controller.handleConfirmedPaymentEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should handle create a scheduled payment notification successfully', async () => {
      const { id, user, state, value, beneficiaryName } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
          state: PaymentState.SCHEDULED,
          createdAt: new Date(),
        });

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPaymentStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        beneficiaryName,
        value,
      };

      await controller.handleConfirmedPaymentEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should handle create a failed payment notification successfully', async () => {
      const { id, user, state, value, beneficiaryName } =
        await PaymentFactory.create<PaymentEntity>(PaymentEntity.name, {
          state: PaymentState.FAILED,
          createdAt: new Date(),
        });

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPaymentStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        beneficiaryName,
        value,
      };

      await controller.handleConfirmedPaymentEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not handle create notification when missing params', async () => {
      const message: SendPaymentStateChangeNotificationRequest = {
        id: null,
        userId: faker.datatype.uuid(),
        state: PaymentState.PENDING,
        notificationId: faker.datatype.uuid(),
        beneficiaryName: faker.name.firstName(),
        value: faker.datatype.number({ min: 1, max: 99999 }),
      };

      const testScript = () =>
        controller.handleConfirmedPaymentEvent(
          message,
          logger,
          bellNotificationRepository,
          eventEmitter,
          userService,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockEmitEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
