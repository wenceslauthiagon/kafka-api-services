import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  KeyState,
  KeyType,
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import {
  NotificationService,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  PixKeyModel,
  SendCodePixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyVerificationDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { SendCodePixKeyRequest } from '@zro/pix-keys/interface';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('SendCodePixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyVerification: PixKeyVerificationRepository;

  const notificationService: NotificationService =
    createMock<NotificationService>();
  const mockSendEmailCode: jest.Mock = On(notificationService).get(
    method((mock) => mock.sendEmailCode),
  );
  const mockSendSmsCode: jest.Mock = On(notificationService).get(
    method((mock) => mock.sendSmsCode),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyVerification = new PixKeyVerificationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('SendCodePixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should send e-mail successfully', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING, type: KeyType.EMAIL },
        );

        const message: SendCodePixKeyRequest = {
          userId,
          id,
        };

        await controller.execute(
          pixKeyRepository,
          pixKeyVerification,
          notificationService,
          logger,
          message,
        );

        expect(mockSendEmailCode).toHaveBeenCalledTimes(1);
        expect(mockSendSmsCode).toHaveBeenCalledTimes(0);

        expect(mockSendEmailCode.mock.calls[0][0]).toBeDefined();
        expect(mockSendEmailCode.mock.calls[0][1]).toBeDefined();
        expect(mockSendEmailCode.mock.calls[0][2]).toBeDefined();
        expect(mockSendEmailCode.mock.calls[0][3]).toBeDefined();
        expect(mockSendEmailCode.mock.calls[0][0].uuid).toBe(userId);
        expect(mockSendEmailCode.mock.calls[0][1].id).toBe(id);
      });

      it('TC0002 - Should send SMS successfully', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING, type: KeyType.PHONE },
        );

        const message: SendCodePixKeyRequest = {
          userId,
          id,
        };

        await controller.execute(
          pixKeyRepository,
          pixKeyVerification,
          notificationService,
          logger,
          message,
        );

        expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
        expect(mockSendSmsCode).toHaveBeenCalledTimes(1);

        expect(mockSendSmsCode.mock.calls[0][0]).toBeDefined();
        expect(mockSendSmsCode.mock.calls[0][1]).toBeDefined();
        expect(mockSendSmsCode.mock.calls[0][2]).toBeDefined();
        expect(mockSendSmsCode.mock.calls[0][0].uuid).toBe(userId);
        expect(mockSendSmsCode.mock.calls[0][1].id).toBe(id);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not sent e-mail id is missing', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING, type: KeyType.PHONE },
        );

        const message: SendCodePixKeyRequest = {
          userId,
          id: null,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerification,
            notificationService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
        expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not send code when id is not uuid', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING, type: KeyType.PHONE },
        );

        const message: SendCodePixKeyRequest = {
          userId,
          id: 'x',
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerification,
            notificationService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
        expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not send a code when key is not found', async () => {
        const { userId } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING, type: KeyType.PHONE },
        );

        const message: SendCodePixKeyRequest = {
          userId,
          id: uuidV4(),
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerification,
            notificationService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

        expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
        expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not send a code when key is canceled', async () => {
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: SendCodePixKeyRequest = {
          userId,
          id,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerification,
            notificationService,
            logger,
            message,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

        expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
        expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
