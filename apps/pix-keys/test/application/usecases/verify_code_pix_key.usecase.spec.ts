import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { UserEntity } from '@zro/users/domain';
import {
  ClaimReasonType,
  KeyState,
  PixKeyRepository,
  PixKeyVerificationRepository,
  PixKeyVerificationState,
} from '@zro/pix-keys/domain';
import {
  VerifyCodePixKeyUseCase as UseCase,
  PixKeyEventEmitter,
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
  PixKeyVerificationOverflowException,
} from '@zro/pix-keys/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
  PixKeyVerificationModel,
  PixKeyVerificationDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  PixKeyFactory,
  PixKeyVerificationFactory,
} from '@zro/test/pix-keys/config';

describe('VerifyCodePixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyVerificationRepository: PixKeyVerificationRepository;

  const NUMBER_OF_RETRIES = 3;

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockNotConfirmedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.notConfirmedPixKey),
  );
  const mockClaimDeniedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.claimDeniedPixKey),
  );
  const mockConfirmedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.confirmedPixKey),
  );
  const mockClaimClosingPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.claimClosingPixKey),
  );
  const mockClaimNotConfirmedPixKeyEvent: jest.Mock = On(
    pixKeyEventService,
  ).get(method((mock) => mock.claimNotConfirmedPixKey));

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyVerificationRepository = new PixKeyVerificationDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid code', () => {
    it('TC0001 - Should verify key in PENDING state successfully', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, code, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CONFIRMED);

      const verify = await PixKeyVerificationModel.findOne({
        where: {
          pixKeyId: id,
        },
      });

      expect(verify).toBeDefined();
      expect(verify.state).toBe(PixKeyVerificationState.OK);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockConfirmedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });

    it('TC0002 - Should verify key in PENDING state and with one failed verification successfully', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      await PixKeyVerificationFactory.create<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, code, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CONFIRMED);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(2);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.OK).length,
      ).toBe(1);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockConfirmedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });

    it('TC0003 - Should verify key in PENDING state and with almost all failed verification successfully', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      await PixKeyVerificationFactory.createMany<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        NUMBER_OF_RETRIES - 1,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, code, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CONFIRMED);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(NUMBER_OF_RETRIES);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.OK).length,
      ).toBe(1);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockConfirmedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });

    it('TC0004 - Should verify key in CLAIM_PENDING state successfully', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CLAIM_PENDING },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, code, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_DENIED);

      const verify = await PixKeyVerificationModel.findOne({
        where: {
          pixKeyId: id,
        },
      });

      expect(verify).toBeDefined();
      expect(verify.state).toBe(PixKeyVerificationState.OK);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockClaimDeniedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });

    it('TC0005 - Should verify key in CLAIM_PENDING state and with one failed verification successfully', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CLAIM_PENDING },
      );

      await PixKeyVerificationFactory.create<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, code, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_DENIED);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(2);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.OK).length,
      ).toBe(1);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockClaimDeniedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });

    it('TC0006 - Should verify key in CLAIM_PENDING state and with almost all failed verification successfully', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        { state: KeyState.CLAIM_PENDING },
      );

      await PixKeyVerificationFactory.createMany<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        NUMBER_OF_RETRIES - 1,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, code, reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_DENIED);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(NUMBER_OF_RETRIES);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.OK).length,
      ).toBe(1);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockClaimDeniedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });
  });

  describe('With invalid code', () => {
    it('TC0007 - Should not verify key in PENDING state', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, 'XXXXX', reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.PENDING);

      const verify = await PixKeyVerificationModel.findOne({
        where: {
          pixKeyId: id,
        },
      });

      expect(verify).toBeDefined();
      expect(verify.state).toBe(PixKeyVerificationState.FAILED);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not verify key in PENDING state and with one failed verification', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      await PixKeyVerificationFactory.create<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, 'XXXXX', reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.PENDING);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(2);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.FAILED)
          .length,
      ).toBe(2);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not verify key in PENDING state and with almost all failed verification', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      await PixKeyVerificationFactory.createMany<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        NUMBER_OF_RETRIES - 1,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, 'XXXXX', reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.NOT_CONFIRMED);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(NUMBER_OF_RETRIES);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.FAILED)
          .length,
      ).toBe(NUMBER_OF_RETRIES);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);

      expect(mockNotConfirmedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });

    it('TC0010 - Should not verify key in CLAIM_PENDING state', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_PENDING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, 'XXXXX', reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_PENDING);

      const verify = await PixKeyVerificationModel.findOne({
        where: { pixKeyId: id },
      });

      expect(verify).toBeDefined();
      expect(verify.state).toBe(PixKeyVerificationState.FAILED);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not verify key in CLAIM_PENDING state and with one failed verification', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_PENDING,
        },
      );

      await PixKeyVerificationFactory.create<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, 'XXXXX', reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_PENDING);

      const verifies = await PixKeyVerificationModel.findAll({
        where: {
          pixKeyId: id,
        },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(2);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.FAILED)
          .length,
      ).toBe(2);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should not verify key in CLAIM_PENDING state and with almost all failed verification', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_PENDING,
        },
      );

      await PixKeyVerificationFactory.createMany<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        NUMBER_OF_RETRIES - 1,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const result = await usecase.execute(user, id, 'XXXXX', reason);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(userId);
      expect(result.state).toBe(KeyState.CLAIM_NOT_CONFIRMED);

      const verifies = await PixKeyVerificationModel.findAll({
        where: { pixKeyId: id },
      });

      expect(verifies).toBeDefined();
      expect(verifies.length).toBe(NUMBER_OF_RETRIES);

      expect(
        verifies.filter((v) => v.state === PixKeyVerificationState.FAILED)
          .length,
      ).toBe(NUMBER_OF_RETRIES);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);

      expect(mockClaimNotConfirmedPixKeyEvent.mock.calls[0][0].id).toBe(id);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0013 - Should fail to verify a key in non expected state', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_CLOSING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, id, code, reason);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0014 - Should fail to verify a not found key', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_CLOSING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, uuidV4(), code, reason);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - Should fail to verify a key without user', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_CLOSING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const testScript = () => usecase.execute(null, id, code, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0016 - Should fail to verify a key without a key', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_CLOSING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, null, code, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0017 - Should fail to verify a key without a code', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.CLAIM_CLOSING,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, id, null, reason);

      await expect(testScript).rejects.toThrow(MissingDataException);

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0018 - Should fail to verify a key with all tries failed', async () => {
      const reason: ClaimReasonType = ClaimReasonType.USER_REQUESTED;
      const { id, userId, code } = await PixKeyFactory.create<PixKeyModel>(
        PixKeyModel.name,
        {
          state: KeyState.PENDING,
        },
      );

      await PixKeyVerificationFactory.createMany<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
        NUMBER_OF_RETRIES,
        {
          pixKeyId: id,
          state: PixKeyVerificationState.FAILED,
        },
      );

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        pixKeyVerificationRepository,
        pixKeyEventService,
        NUMBER_OF_RETRIES,
      );

      const user = new UserEntity({ uuid: userId });

      const testScript = () => usecase.execute(user, id, code, reason);

      await expect(testScript).rejects.toThrow(
        PixKeyVerificationOverflowException,
      );

      expect(mockNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimDeniedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimClosingPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockClaimNotConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
