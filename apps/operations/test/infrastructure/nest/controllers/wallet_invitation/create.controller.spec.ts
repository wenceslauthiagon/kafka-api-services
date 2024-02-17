import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { method, On } from 'ts-auto-mock/extension';
import { createMock } from 'ts-auto-mock';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  WalletInvitationRepository,
  WalletInvitationState,
  WalletRepository,
  WalletState,
} from '@zro/operations/domain';
import { NotificationService, UserService } from '@zro/operations/application';
import {
  CreateWalletInvitationMicroserviceController as Controller,
  WalletInvitationDatabaseRepository,
  WalletDatabaseRepository,
  WalletModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { CreateWalletInvitationRequest } from '@zro/operations/interface';
import { WalletFactory } from '@zro/test/operations/config';
import { UserFactory } from '@zro/test/users/config';

describe('CreateWalletInvitationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletInvitationRepository: WalletInvitationRepository;
  let walletRepository: WalletRepository;

  const CLIENT = 'CLIENT';

  const userService: UserService = createMock<UserService>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const notificationService: NotificationService =
    createMock<NotificationService>();
  const mockSendNotificationService: jest.Mock = On(notificationService).get(
    method((mock) => mock.sendEmailWalletInvitation),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletInvitationRepository = new WalletInvitationDatabaseRepository();
    walletRepository = new WalletDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateWalletInvitation', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not create with invalid parameters', async () => {
        const message: CreateWalletInvitationRequest = {
          id: uuidV4(),
          email: null,
          walletId: null,
          userId: null,
          permissionTypeTags: null,
        };

        await expect(() =>
          controller.execute(
            walletInvitationRepository,
            walletRepository,
            userService,
            notificationService,
            logger,
            message,
            ctx,
          ),
        ).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should create wallet invitation successfully', async () => {
        const id = uuidV4();
        const email = 'teste@zrobank.com.br';

        const user = await UserFactory.create<UserEntity>(UserEntity.name);
        const wallet = await WalletFactory.create<WalletModel>(
          WalletModel.name,
          { state: WalletState.ACTIVE, userId: user.id, userUUID: user.uuid },
        );

        const { uuid: userId } = user;
        const { uuid: walletId } = wallet;
        const permissionTypeTags = [CLIENT];
        mockGetUserByUuidService.mockResolvedValue(user);

        const message: CreateWalletInvitationRequest = {
          id,
          email,
          walletId,
          userId,
          permissionTypeTags,
        };

        const result = await controller.execute(
          walletInvitationRepository,
          walletRepository,
          userService,
          notificationService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.state).toBe(WalletInvitationState.PENDING);
        expect(result.value.walletId).toBe(walletId);
        expect(result.value.permissionTypeTags).toHaveLength(
          permissionTypeTags.length,
        );
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
        expect(mockSendNotificationService).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
