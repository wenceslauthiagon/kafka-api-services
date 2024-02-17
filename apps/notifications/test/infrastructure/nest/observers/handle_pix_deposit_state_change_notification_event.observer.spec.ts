import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { PixDepositEntity, PixDepositState } from '@zro/pix-payments/domain';
import { BellNotificationRepository } from '@zro/notifications/domain';
import { UserEntity } from '@zro/users/domain';
import {
  PixDepositStateChangeNotificationNestObserver as Observer,
  BellNotificationDatabaseRepository,
  UserServiceKafka,
} from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import {
  BellNotificationEventEmitterControllerInterface,
  SendPixDepositStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import { PixDepositFactory } from '@zro/test/pix-payments/config';
import { UserFactory } from '@zro/test/users/config';

describe('PixDepositStateChangeNotificationNestObserver', () => {
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
    it('TC0001 - Should handle create a received deposit notification successfully', async () => {
      const { id, user, state, amount, thirdPartName } =
        await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.RECEIVED,
            createdAt: new Date(),
          },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPixDepositStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
        thirdPartName,
      };

      await controller.handleReceivedPixDepositEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle create a error deposit notification successfully', async () => {
      const { id, user, state, amount, thirdPartName } =
        await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.ERROR,
            createdAt: new Date(),
          },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPixDepositStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
        thirdPartName,
      };

      await controller.handleReceivedPixDepositEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should handle create a waiting deposit notification successfully', async () => {
      const { id, user, state, amount, thirdPartName } =
        await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.WAITING,
            createdAt: new Date(),
          },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPixDepositStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
        thirdPartName,
      };

      await controller.handleReceivedPixDepositEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0004 - Should handle create a blocked deposit notification successfully', async () => {
      const { id, user, state, amount, thirdPartName } =
        await PixDepositFactory.create<PixDepositEntity>(
          PixDepositEntity.name,
          {
            state: PixDepositState.BLOCKED,
            createdAt: new Date(),
          },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPixDepositStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
        thirdPartName,
      };

      await controller.handleReceivedPixDepositEvent(
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
    it('TC0005 - Should not handle create notification if missing params', async () => {
      const message: SendPixDepositStateChangeNotificationRequest = {
        id: null,
        userId: faker.datatype.uuid(),
        state: PixDepositState.BLOCKED,
        notificationId: faker.datatype.uuid(),
        amount: faker.datatype.number({ min: 1, max: 99999 }),
        thirdPartName: `${faker.name.firstName()} ${faker.name.lastName()}`,
      };

      const testScript = () =>
        controller.handleReceivedPixDepositEvent(
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
