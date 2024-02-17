import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { BellNotificationRepository } from '@zro/notifications/domain';
import { UserEntity } from '@zro/users/domain';
import {
  WarningPixDepositEntity,
  WarningPixDepositState,
} from '@zro/pix-payments/domain';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import {
  WarningPixDepositStateChangeNotificationNestObserver as Observer,
  BellNotificationDatabaseRepository,
  UserServiceKafka,
} from '@zro/notifications/infrastructure';
import { WarningPixDepositFactory } from '@zro/test/pix-payments/config';
import {
  BellNotificationEventEmitterControllerInterface,
  SendWarningPixDepositStateChangeNotificationRequest,
} from '@zro/notifications/interface';
import { UserFactory } from '@zro/test/users/config';

describe('WarningPixDepositStateChangeNotificationNestObserver', () => {
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
    it('TC0001 - Should handle create a created warning deposit notification successfully', async () => {
      const { id, user, state } =
        await WarningPixDepositFactory.create<WarningPixDepositEntity>(
          WarningPixDepositEntity.name,
          {
            state: WarningPixDepositState.CREATED,
            createdAt: new Date(),
          },
        );

      const amount = faker.datatype.number(999);
      const thirdPartName = faker.name.fullName();

      const userFound = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValue(userFound);

      const message: SendWarningPixDepositStateChangeNotificationRequest = {
        id,
        userId: user.uuid,
        state,
        notificationId: faker.datatype.uuid(),
        amount,
        thirdPartName,
      };

      await controller.handleCreatedWarningPixDepositEvent(
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
      const message: SendWarningPixDepositStateChangeNotificationRequest = {
        id: null,
        userId: faker.datatype.uuid(),
        state: WarningPixDepositState.APPROVED,
        notificationId: faker.datatype.uuid(),
        amount: faker.datatype.number({ min: 1, max: 99999 }),
        thirdPartName: `${faker.name.firstName()} ${faker.name.lastName()}`,
      };

      const testScript = () =>
        controller.handleCreatedWarningPixDepositEvent(
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
