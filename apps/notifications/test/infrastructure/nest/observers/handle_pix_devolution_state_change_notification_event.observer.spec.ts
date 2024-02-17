import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import {
  PixDevolutionEntity,
  PixDevolutionState,
} from '@zro/pix-payments/domain';
import {
  PixDevolutionStateChangeNotificationNestObserver as Observer,
  BellNotificationDatabaseRepository,
  UserServiceKafka,
} from '@zro/notifications/infrastructure';
import { PixDevolutionFactory } from '@zro/test/pix-payments/config';
import { BellNotificationRepository } from '@zro/notifications/domain';
import {
  BellNotificationEventEmitterControllerInterface,
  SendPixDevolutionStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import { UserFactory } from '@zro/test/users/config';
import { UserEntity } from '@zro/users/domain';

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
    it('TC0001 - Should handle create a confirmed devolution notification successfully', async () => {
      const { id, user, state, amount } =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            state: PixDevolutionState.CONFIRMED,
            createdAt: new Date(),
          },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPixDevolutionStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
      };

      await controller.handleConfirmedPixDevolutionEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle create a failed devolution notification successfully', async () => {
      const { id, user, state, amount } =
        await PixDevolutionFactory.create<PixDevolutionEntity>(
          PixDevolutionEntity.name,
          {
            state: PixDevolutionState.FAILED,
            createdAt: new Date(),
          },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendPixDevolutionStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
      };

      await controller.handleConfirmedPixDevolutionEvent(
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
    it('TC0003 - Should not handle create notification if missing params', async () => {
      const message: SendPixDevolutionStateChangeNotificationRequest = {
        id: null,
        userId: faker.datatype.uuid(),
        state: PixDevolutionState.ERROR,
        notificationId: faker.datatype.uuid(),
        amount: faker.datatype.number({ min: 1, max: 99999 }),
      };

      const testScript = () =>
        controller.handleConfirmedPixDevolutionEvent(
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
