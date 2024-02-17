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
  HandleBellNotificationCreatedUseCase as UseCase,
  BellNotificationEventEmitter,
  PushNotificationGateway,
  BellNotificationNotFoundException,
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

    const mockEmitSentEvent: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.sentPushNotification),
    );

    return {
      eventEmitter,
      mockEmitSentEvent,
    };
  };

  const mockRepository = () => {
    const bellNotificationRepository: BellNotificationRepository =
      createMock<BellNotificationRepository>();
    const mockGetBellNotificationByUUID: jest.Mock = On(
      bellNotificationRepository,
    ).get(method((mock) => mock.getByUuid));

    return {
      bellNotificationRepository,
      mockGetBellNotificationByUUID,
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

  const mockGateway = () => {
    const bellNotificationGateway: PushNotificationGateway =
      createMock<PushNotificationGateway>();
    const mockSendPushNotificationGateway: jest.Mock = On(
      bellNotificationGateway,
    ).get(method((mock) => mock.send));

    return {
      bellNotificationGateway,
      mockSendPushNotificationGateway,
    };
  };

  const makeSut = () => {
    const { bellNotificationRepository, mockGetBellNotificationByUUID } =
      mockRepository();

    const { eventEmitter, mockEmitSentEvent } = mockEmitter();

    const { bellNotificationGateway, mockSendPushNotificationGateway } =
      mockGateway();

    const { userService, mockGetUserService } = mockService();

    const sut = new UseCase(
      bellNotificationRepository,
      eventEmitter,
      bellNotificationGateway,
      userService,
      logger,
    );

    return {
      sut,
      bellNotificationRepository,
      mockGetBellNotificationByUUID,
      eventEmitter,
      mockEmitSentEvent,
      bellNotificationGateway,
      mockSendPushNotificationGateway,
      userService,
      mockGetUserService,
    };
  };

  describe('With valid parameters', () => {
    it('TC0001 - Should handle sent notification successfully', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockSendPushNotificationGateway,
        mockEmitSentEvent,
        mockGetUserService,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        active: true,
      });

      mockGetUserService.mockResolvedValueOnce(user);

      const bellNotification =
        await BellNotificationFactory.create<BellNotificationEntity>(
          BellNotificationEntity.name,
        );

      mockGetBellNotificationByUUID.mockResolvedValueOnce(bellNotification);

      await sut.execute(bellNotification.uuid);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(1);
      expect(mockSendPushNotificationGateway).toHaveBeenCalledTimes(1);
      expect(mockEmitSentEvent).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should throw MissingDataException if there are missing data', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockSendPushNotificationGateway,
        mockEmitSentEvent,
        mockGetUserService,
      } = makeSut();

      const testScript = () => sut.execute(undefined);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(0);
      expect(mockSendPushNotificationGateway).toHaveBeenCalledTimes(0);
      expect(mockEmitSentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw BellNotificationNotFoundException if BellNotification there is not found', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockSendPushNotificationGateway,
        mockEmitSentEvent,
        mockGetUserService,
      } = makeSut();

      const bellNotification =
        await BellNotificationFactory.create<BellNotificationEntity>(
          BellNotificationEntity.name,
        );

      mockGetBellNotificationByUUID.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(bellNotification.uuid);

      await expect(testScript).rejects.toThrow(
        BellNotificationNotFoundException,
      );

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(1);
      expect(mockSendPushNotificationGateway).toHaveBeenCalledTimes(0);
      expect(mockEmitSentEvent).toHaveBeenCalledTimes(0);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw UserNotFoundException if user not found', async () => {
      const {
        sut,
        mockGetBellNotificationByUUID,
        mockSendPushNotificationGateway,
        mockEmitSentEvent,
        mockGetUserService,
      } = makeSut();

      mockGetUserService.mockResolvedValueOnce(null);

      const bellNotification =
        await BellNotificationFactory.create<BellNotificationEntity>(
          BellNotificationEntity.name,
        );

      mockGetBellNotificationByUUID.mockResolvedValueOnce(bellNotification);

      const testScript = () => sut.execute(bellNotification.uuid);

      await expect(testScript).rejects.toThrow(UserNotFoundException);

      expect(mockGetBellNotificationByUUID).toHaveBeenCalledTimes(1);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockSendPushNotificationGateway).toHaveBeenCalledTimes(0);
      expect(mockEmitSentEvent).toHaveBeenCalledTimes(0);
    });
  });
});
