import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  EncryptService,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  BellNotificationEntity,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import {
  CreateBellNotificationUseCase as UseCase,
  BellNotificationEventEmitter,
  UserService,
} from '@zro/notifications/application';
import { UserNotFoundException } from '@zro/users/application';
import { UserFactory } from '@zro/test/users/config';
import { BellNotificationFactory } from '@zro/test/notifications/config';

describe('HandleBellNotificationCreatedUseCase', () => {
  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  const mockEmitter = () => {
    const eventEmitter: BellNotificationEventEmitter =
      createMock<BellNotificationEventEmitter>();

    const mockEmitCreatedEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.createdPushNotification),
    );

    return {
      eventEmitter,
      mockEmitCreatedEvent,
    };
  };

  const mockRepository = () => {
    const bellNotificationRepository: BellNotificationRepository =
      createMock<BellNotificationRepository>();
    const mockGetBellNotificationByUUID: jest.Mock = On(
      bellNotificationRepository,
    ).get(method((mock) => mock.getByUuid));
    const mockCreateBellNotification: jest.Mock = On(
      bellNotificationRepository,
    ).get(method((mock) => mock.create));

    return {
      bellNotificationRepository,
      mockGetBellNotificationByUUID,
      mockCreateBellNotification,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    return {
      userService,
      mockGetUserService,
    };
  };

  const makeSut = () => {
    const {
      bellNotificationRepository,
      mockGetBellNotificationByUUID,
      mockCreateBellNotification,
    } = mockRepository();

    const { eventEmitter, mockEmitCreatedEvent } = mockEmitter();

    const { userService, mockGetUserService } = mockService();

    const sut = new UseCase(
      logger,
      bellNotificationRepository,
      eventEmitter,
      userService,
    );

    return {
      sut,
      bellNotificationRepository,
      mockGetBellNotificationByUUID,
      mockCreateBellNotification,
      eventEmitter,
      mockEmitCreatedEvent,
      userService,
      mockGetUserService,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should create notification successfully', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockCreateBellNotification,
        mockGetUserService,
        mockEmitCreatedEvent,
      } = makeSut();

      const bellNotification =
        await BellNotificationFactory.create<BellNotificationEntity>(
          BellNotificationEntity.name,
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        active: true,
      });

      mockGetUserService.mockResolvedValue(user);

      mockGetBellNotificationByUUID.mockResolvedValueOnce(null);

      const { uuid, title, description, type } = bellNotification;

      await sut.execute(uuid, user, title, description, type);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(1);
      expect(mockCreateBellNotification).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if there are missing data', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockCreateBellNotification,
        mockGetUserService,
        mockEmitCreatedEvent,
      } = makeSut();

      const testScript = () =>
        sut.execute(undefined, undefined, undefined, undefined, undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(0);
      expect(mockCreateBellNotification).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw BellNotificationNotFoundException if user there is not found', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockCreateBellNotification,
        mockGetUserService,
        mockEmitCreatedEvent,
      } = makeSut();

      const bellNotification =
        await BellNotificationFactory.create<BellNotificationEntity>(
          BellNotificationEntity.name,
        );

      mockGetBellNotificationByUUID.mockResolvedValueOnce(null);

      const { uuid, user, title, description, type } = bellNotification;

      const testScript = () =>
        sut.execute(uuid, user, title, description, type);

      mockGetUserService.mockResolvedValueOnce(null);

      await expect(testScript).rejects.toThrow(UserNotFoundException);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(1);
      expect(mockCreateBellNotification).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should return BellNotification state is failed', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockCreateBellNotification,
        mockGetUserService,
        mockEmitCreatedEvent,
      } = makeSut();

      const bellNotification =
        await BellNotificationFactory.create<BellNotificationEntity>(
          BellNotificationEntity.name,
        );

      mockGetBellNotificationByUUID.mockResolvedValueOnce(bellNotification);

      const { uuid, user, title, description, type } = bellNotification;

      await sut.execute(uuid, user, title, description, type);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(1);
      expect(mockCreateBellNotification).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockEmitCreatedEvent).toHaveBeenCalledTimes(0);
    });
  });
});
