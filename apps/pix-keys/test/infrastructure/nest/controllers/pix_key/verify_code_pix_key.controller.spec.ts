import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import {
  PixKeyModel,
  PixKeyDatabaseRepository,
  PixKeyVerificationDatabaseRepository,
  VerifyCodePixKeyMicroserviceController as Controller,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyNotFoundException } from '@zro/pix-keys/application';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import {
  PixKeyEventEmitterControllerInterface,
  VerifyCodePixKeyRequest,
} from '@zro/pix-keys/interface';
import { KafkaContext } from '@nestjs/microservices';

describe('VerifyCodePixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyVerificationRepository: PixKeyVerificationRepository;

  const pixKeyEventEmitter: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventEmitter).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyVerificationRepository = new PixKeyVerificationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('VerifyCodePixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should verify key successfully', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, id, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id,
          code,
          reason,
        };

        await controller.execute(
          pixKeyRepository,
          pixKeyVerificationRepository,
          pixKeyEventEmitter,
          logger,
          message,
          ctx,
        );

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not verify when id is missing', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.PENDING },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id: null,
          code,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not verify code when id is not uuid', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PENDING,
          },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id: 'x',
          code,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not verify a code when key is not found', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          {
            state: KeyState.PENDING,
          },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id: uuidV4(),
          code,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not verify a code when key is canceled', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, id, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id,
          code,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not verify a code when code is missing', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id,
          code: null,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not verify a code with not well formed code (5 digits) - part 1', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id,
          code: '0000',
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should not verify a code with not well formed code (5 digits) - part 2', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { userId, id } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: VerifyCodePixKeyRequest = {
          userId,
          id,
          code: 'XXXXX',
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should not verify a code with user id is missing', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: VerifyCodePixKeyRequest = {
          userId: null,
          id,
          code,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should not verify a code with user id is not an UUID', async () => {
        const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
        const { id, code } = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { state: KeyState.CANCELED },
        );

        const message: VerifyCodePixKeyRequest = {
          userId: 'x',
          id,
          code,
          reason,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyVerificationRepository,
            pixKeyEventEmitter,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);

        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
