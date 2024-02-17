import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService, defaultLogger as logger } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import { BellNotificationRepository } from '@zro/notifications/domain';
import { UserService } from '@zro/notifications/application';
import {
  BellNotificationDatabaseRepository,
  BellNotificationModel,
  BellNotificationNestObserver,
} from '@zro/notifications/infrastructure';
import { PushNotificationGateway } from '@zro/notifications/application';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import {
  HandleBellNotificationCreatedEventRequest,
  BellNotificationEventEmitterControllerInterface,
} from '@zro/notifications/interface';
import { BellNotificationFactory } from '@zro/test/notifications/config';
import { UserFactory } from '@zro/test/users/config';

describe('BellNotificationController', () => {
  let module: TestingModule;
  let observer: BellNotificationNestObserver;
  let notificationRepository: BellNotificationRepository;

  const eventEmitter: BellNotificationEventEmitterControllerInterface =
    createMock<BellNotificationEventEmitterControllerInterface>();
  const mockSentBellNotificationEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.sentCreatedEvent),
  );

  const mockPushNotificationGateway: PushNotificationGateway =
    createMock<PushNotificationGateway>();
  const mockSendPushNotificationGateway: jest.Mock = On(
    mockPushNotificationGateway,
  ).get(method((mock) => mock.send));

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUUIDService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();

    observer = module.get(BellNotificationNestObserver);
    notificationRepository = new BellNotificationDatabaseRepository();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  it('TC0001 - should be defined', () => {
    expect(observer).toBeDefined();
  });

  describe('Handle created Bell Notification', () => {
    describe('With valid parameters', () => {
      it('TC0002 - Should handle created notification successfully', async () => {
        const notification =
          await BellNotificationFactory.create<BellNotificationModel>(
            BellNotificationModel.name,
          );

        const user = await UserFactory.create<UserEntity>(UserEntity.name, {
          active: true,
        });

        mockGetUserByUUIDService.mockResolvedValueOnce(user);

        const message: HandleBellNotificationCreatedEventRequest = {
          uuid: notification.uuid,
        };

        await observer.handleBellNotificationCreatedEventViaFcm(
          message,
          notificationRepository,
          userService,
          eventEmitter,
          logger,
          mockPushNotificationGateway,
        );

        expect(mockSentBellNotificationEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockSendPushNotificationGateway).toHaveBeenCalledTimes(1);

        expect(mockSendPushNotificationGateway.mock.calls[0][0].id).toBe(
          notification.id,
        );
      });
    });
  });

  // describe('With invalid parameters', () => {
  //   it('TC0003 - Should not handle created if bell notification not exists', async () => {
  //     const message: HandleBellNotificationCreatedEventKafka = {
  //       key: uuidV4(),
  //       value: {
  //         uuid: uuidV4(),
  //       },
  //       headers: {},
  //     };

  //     await observer.handleBellNotificationCreatedEventViaFcm(
  //       message,
  //       notificationRepository,
  //       userService,
  //       eventEmitter,
  //       logger,
  //       mockPushNotificationGateway,
  //     );

  //     expect(mockSendPushNotificationGateway).toHaveBeenCalledTimes(0);
  //     expect(mockSentBellNotificationEventEmitter).toHaveBeenCalledTimes(0);
  //   });
  // });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
