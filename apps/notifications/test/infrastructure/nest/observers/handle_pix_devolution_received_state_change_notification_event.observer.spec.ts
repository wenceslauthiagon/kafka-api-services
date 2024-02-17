import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';
import { UserEntity } from '@zro/users/domain';
import { BellNotificationRepository } from '@zro/notifications/domain';
import {
  PixDevolutionReceivedStateChangeNotificationNestObserver as Observer,
  BellNotificationDatabaseRepository,
  UserServiceKafka,
} from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import {
  BellNotificationEventEmitterControllerInterface,
  ReceivePixDevolutionStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import { PixDevolutionReceivedFactory } from '@zro/test/pix-payments/config';
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
    it('TC0001 - Should create a ready received devolution notification successfully', async () => {
      const { id, user, state, amount } =
        await PixDevolutionReceivedFactory.create<PixDevolutionReceivedEntity>(
          PixDevolutionReceivedEntity.name,
          { state: PixDevolutionReceivedState.READY },
        );

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: ReceivePixDevolutionStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
      };

      await controller.handleReceivePixDevolutionReadyEvent(
        message,
        logger,
        bellNotificationRepository,
        eventEmitter,
        userService,
      );

      expect(mockEmitEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not create a received devolution notification if missing params', async () => {
        const message: ReceivePixDevolutionStateChangeNotificationRequest = {
          id: null,
          userId: faker.datatype.uuid(),
          state: PixDevolutionReceivedState.ERROR,
          notificationId: faker.datatype.uuid(),
          amount: faker.datatype.number({ min: 1, max: 99999 }),
        };

        const testScript = () =>
          controller.handleReceivePixDevolutionReadyEvent(
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
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
