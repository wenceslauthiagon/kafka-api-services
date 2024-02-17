import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  defaultLogger as logger,
  MissingDataException,
  NullPointerException,
} from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  KeyState,
  KeyType,
  PixKeyRepository,
  PixKeyVerificationRepository,
} from '@zro/pix-keys/domain';
import {
  SendCodePixKeyUseCase as UseCase,
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
  NotificationService,
  PixKeyInvalidTypeException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyVerificationDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('SendCodePixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyVerificationRepository: PixKeyVerificationRepository;

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
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyVerificationRepository = new PixKeyVerificationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  const executeUseCase = async (
    keyId: string,
    userId: string,
    emailTag: string,
    emailFrom: string,
    smsTag: string,
  ): Promise<void> => {
    const usecase = new UseCase(
      logger,
      pixKeyRepository,
      pixKeyVerificationRepository,
      notificationService,
      emailTag,
      emailFrom,
      smsTag,
    );
    const user = new UserEntity({ uuid: userId });
    await usecase.execute(user, keyId);
  };

  describe('With e-mail key type', () => {
    it('TC0001 - Should send e-mail successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await executeUseCase(
        pixKey.id,
        pixKey.userId,
        emailTag,
        emailFrom,
        smsTag,
      );

      expect(mockSendEmailCode).toHaveBeenCalledTimes(1);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);

      expect(mockSendEmailCode.mock.calls[0][0]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][1]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][2]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][3]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][0].uuid).toBe(pixKey.userId);
      expect(mockSendEmailCode.mock.calls[0][1].id).toBe(pixKey.id);
      expect(mockSendEmailCode.mock.calls[0][2]).toBe(emailFrom);
      expect(mockSendEmailCode.mock.calls[0][3]).toBe(emailTag);
    });

    it('TC0002 - Should not send e-mail with a invalid key id', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(uuidV4(), pixKey.userId, emailTag, emailFrom, smsTag),
      ).rejects.toThrow(PixKeyNotFoundException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not send e-mail without a key id', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(null, pixKey.userId, emailTag, emailFrom, smsTag),
      ).rejects.toThrow(MissingDataException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not send e-mail to a user with key owned by third party', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(pixKey.id, uuidV4(), emailTag, emailFrom, smsTag),
      ).rejects.toThrow(PixKeyNotFoundException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should send e-mail successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
        type: KeyType.EMAIL,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await executeUseCase(
        pixKey.id,
        pixKey.userId,
        emailTag,
        emailFrom,
        smsTag,
      );

      expect(mockSendEmailCode).toHaveBeenCalledTimes(1);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);

      expect(mockSendEmailCode.mock.calls[0][0]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][1]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][2]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][3]).toBeDefined();
      expect(mockSendEmailCode.mock.calls[0][0].uuid).toBe(pixKey.userId);
      expect(mockSendEmailCode.mock.calls[0][1].id).toBe(pixKey.id);
      expect(mockSendEmailCode.mock.calls[0][2]).toBe(emailFrom);
      expect(mockSendEmailCode.mock.calls[0][3]).toBe(emailTag);
    });

    it('TC0006 - Should not send e-mail with a key in invalid state', async () => {
      const invalidStates = Object.values(KeyState).filter(
        (state) =>
          ![
            KeyState.PENDING,
            KeyState.CLAIM_PENDING,
            KeyState.CANCELED,
          ].includes(state),
      );

      const invalidKeys = await PixKeyFactory.createMany<PixKeyModel>(
        PixKeyModel.name,
        invalidStates.map((state) => ({
          state,
          type: KeyType.EMAIL,
        })),
      );

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      for (const key of invalidKeys) {
        await expect(
          executeUseCase(key.id, key.userId, emailTag, emailFrom, smsTag),
        ).rejects.toThrow(PixKeyInvalidStateException);
      }

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not send code with an invalid key type', async () => {
      const invalidTypes = Object.values(KeyType).filter(
        (type) => ![KeyType.EMAIL, KeyType.PHONE].includes(type),
      );

      const invalidKeys = await PixKeyFactory.createMany<PixKeyModel>(
        PixKeyModel.name,
        invalidTypes.map((type) => ({
          state: KeyState.PENDING,
          type,
        })),
      );

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      for (const key of invalidKeys) {
        await expect(
          executeUseCase(key.id, key.userId, emailTag, emailFrom, smsTag),
        ).rejects.toThrow(PixKeyInvalidTypeException);
      }

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not send e-mail to a key without code', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.EMAIL,
        code: null,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(pixKey.id, pixKey.userId, emailTag, emailFrom, smsTag),
      ).rejects.toThrow(NullPointerException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });
  });

  describe('With SMS key type', () => {
    it('TC0009 - Should send SMS successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.PHONE,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await executeUseCase(
        pixKey.id,
        pixKey.userId,
        emailTag,
        emailFrom,
        smsTag,
      );

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(1);

      expect(mockSendSmsCode.mock.calls[0][0]).toBeDefined();
      expect(mockSendSmsCode.mock.calls[0][1]).toBeDefined();
      expect(mockSendSmsCode.mock.calls[0][2]).toBeDefined();
      expect(mockSendSmsCode.mock.calls[0][0].uuid).toBe(pixKey.userId);
      expect(mockSendSmsCode.mock.calls[0][1].id).toBe(pixKey.id);
      expect(mockSendSmsCode.mock.calls[0][2]).toBe(smsTag);
    });

    it('TC0010 - Should not send SMS with a invalid key id', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.PHONE,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(uuidV4(), pixKey.userId, emailTag, emailFrom, smsTag),
      ).rejects.toThrow(PixKeyNotFoundException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not send SMS without a key id', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.PHONE,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(null, pixKey.userId, emailTag, emailFrom, smsTag),
      ).rejects.toThrow(MissingDataException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should not send SMS to a user with key owned by third party', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.PHONE,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(pixKey.id, uuidV4(), emailTag, emailFrom, smsTag),
      ).rejects.toThrow(PixKeyNotFoundException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0013 - Should send SMS successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_PENDING,
        type: KeyType.PHONE,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await executeUseCase(
        pixKey.id,
        pixKey.userId,
        emailTag,
        emailFrom,
        smsTag,
      );

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(1);

      expect(mockSendSmsCode.mock.calls[0][0]).toBeDefined();
      expect(mockSendSmsCode.mock.calls[0][1]).toBeDefined();
      expect(mockSendSmsCode.mock.calls[0][2]).toBeDefined();
      expect(mockSendSmsCode.mock.calls[0][0].uuid).toBe(pixKey.userId);
      expect(mockSendSmsCode.mock.calls[0][1].id).toBe(pixKey.id);
      expect(mockSendSmsCode.mock.calls[0][2]).toBe(smsTag);
    });

    it('TC0014 - Should not send SMS with a key in invalid state', async () => {
      const invalidStates = Object.values(KeyState).filter(
        (state) =>
          ![
            KeyState.PENDING,
            KeyState.CLAIM_PENDING,
            KeyState.CANCELED,
          ].includes(state),
      );

      const invalidKeys = await PixKeyFactory.createMany<PixKeyModel>(
        PixKeyModel.name,
        invalidStates.map((state) => ({
          state,
          type: KeyType.PHONE,
        })),
      );

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      for (const key of invalidKeys) {
        await expect(
          executeUseCase(key.id, key.userId, emailTag, emailFrom, smsTag),
        ).rejects.toThrow(PixKeyInvalidStateException);
      }

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - Should not send SMS to a key without code', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PENDING,
        type: KeyType.PHONE,
        code: null,
      });

      const emailTag = 'EMAIL_TAG';
      const emailFrom = 'email@test.com';
      const smsTag = 'SMS_TAG';

      await expect(
        executeUseCase(pixKey.id, pixKey.userId, emailTag, emailFrom, smsTag),
      ).rejects.toThrow(NullPointerException);

      expect(mockSendEmailCode).toHaveBeenCalledTimes(0);
      expect(mockSendSmsCode).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
