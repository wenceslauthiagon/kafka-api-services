import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  EncryptService,
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { BellNotificationFactory } from '@zro/test/notifications/config';
import {
  BellNotificationEntity,
  BellNotificationRepository,
} from '@zro/notifications/domain';
import { UserEntity } from '@zro/users/domain';
import { UserService } from '@zro/notifications/application';
import { UserNotFoundException } from '@zro/users/application';
import { CreateBellNotificationMicroserviceController as Controller } from '@zro/notifications/infrastructure';
import {
  BellNotificationEventEmitterControllerInterface,
  CreateBellNotificationRequest,
} from '@zro/notifications/interface';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { UserFactory } from '@zro/test/users/config';

describe('CreateBellNotificationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;

  const eventEmitter: BellNotificationEventEmitterControllerInterface =
    createMock<BellNotificationEventEmitterControllerInterface>();
  const mockEmitCreatedNotificationEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitCreatedEvent),
  );

  const bellNotificationRepository: BellNotificationRepository =
    createMock<BellNotificationRepository>();
  const mockCreateNotificationRepository: jest.Mock = On(
    bellNotificationRepository,
  ).get(method((mock) => mock.create));
  const mockGetNotificationByUuidRepository: jest.Mock = On(
    bellNotificationRepository,
  ).get(method((mock) => mock.getByUuid));

  const userService: UserService = createMock<UserService>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();
    controller = module.get<Controller>(Controller);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  describe('ReceiveInfraction', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create notification successfully.', async () => {
        const { uuid, title, type, description } =
          await BellNotificationFactory.create<BellNotificationEntity>(
            BellNotificationEntity.name,
          );

        const user = await UserFactory.create<UserEntity>(UserEntity.name, {
          active: true,
        });

        mockGetUserService.mockResolvedValueOnce(user);

        const message: CreateBellNotificationRequest = {
          uuid,
          userId: user.uuid,
          title,
          type,
          description,
        };

        await controller.execute(
          bellNotificationRepository,
          eventEmitter,
          userService,
          logger,
          message,
          ctx,
        );

        expect(mockEmitCreatedNotificationEvent).toHaveBeenCalledTimes(1);
        expect(mockGetNotificationByUuidRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateNotificationRepository).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not create with invalid params.', async () => {
        const { user, title, type, description } =
          await BellNotificationFactory.create<BellNotificationEntity>(
            BellNotificationEntity.name,
          );

        const message: CreateBellNotificationRequest = {
          uuid: 'x',
          userId: user.uuid,
          title,
          type,
          description,
        };

        const testScript = () =>
          controller.execute(
            bellNotificationRepository,
            eventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockEmitCreatedNotificationEvent).toHaveBeenCalledTimes(0);
        expect(mockGetNotificationByUuidRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateNotificationRepository).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not create if user not found.', async () => {
        const { uuid, user, title, type, description } =
          await BellNotificationFactory.create<BellNotificationEntity>(
            BellNotificationEntity.name,
          );

        const message: CreateBellNotificationRequest = {
          uuid,
          userId: user.uuid,
          title,
          type,
          description,
        };

        mockGetUserService.mockResolvedValueOnce(null);

        const testScript = () =>
          controller.execute(
            bellNotificationRepository,
            eventEmitter,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(UserNotFoundException);
        expect(mockEmitCreatedNotificationEvent).toHaveBeenCalledTimes(0);
        expect(mockGetNotificationByUuidRepository).toHaveBeenCalledTimes(1);
        expect(mockCreateNotificationRepository).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
