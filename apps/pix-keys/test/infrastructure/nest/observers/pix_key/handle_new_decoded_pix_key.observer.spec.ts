import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  DecodedPixKeyState,
  UserPixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  NewDecodedPixKeyNestObserver,
  UserPixKeyDecodeLimitDatabaseRepository,
  DecodedPixKeyModel,
  UserPixKeyDecodeLimitModel,
  PixKeyDecodeLimitModel,
  UserServiceKafka,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { HandleNewDecodedPixKeyEventRequest } from '@zro/pix-keys/interface';
import {
  DecodedPixKeyFactory,
  PixKeyDecodeLimitFactory,
  UserPixKeyDecodeLimitFactory,
} from '@zro/test/pix-keys/config';

describe('NewDecodedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: NewDecodedPixKeyNestObserver;
  let userLimitDecodedPixKeyRepository: UserPixKeyDecodeLimitRepository;

  const userServiceKafka: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userServiceKafka).get(
    method((mock) => mock.getUserByUuid),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();

    controller = module.get<NewDecodedPixKeyNestObserver>(
      NewDecodedPixKeyNestObserver,
    );
    userLimitDecodedPixKeyRepository =
      new UserPixKeyDecodeLimitDatabaseRepository();

    await PixKeyDecodeLimitFactory.create<PixKeyDecodeLimitModel>(
      PixKeyDecodeLimitModel.name,
      { personType: PersonType.NATURAL_PERSON },
    );

    await PixKeyDecodeLimitFactory.create<PixKeyDecodeLimitModel>(
      PixKeyDecodeLimitModel.name,
      { personType: PersonType.LEGAL_PERSON },
    );
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle a confirmed decoded pix key successfully', async () => {
      const { userId } =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitModel>(
          UserPixKeyDecodeLimitModel.name,
          { limit: 99, lastDecodedCreatedAt: new Date() },
        );

      const { id, state, key, type, personType } =
        await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
          { state: DecodedPixKeyState.CONFIRMED, userId },
        );

      mockGetUserByUuidService.mockResolvedValue({ type: personType });

      const message: HandleNewDecodedPixKeyEventRequest = {
        id,
        state,
        key,
        type,
        userId,
      };

      await controller.handleConfirmedDecodedPixKey(
        message,
        userLimitDecodedPixKeyRepository,
        userServiceKafka,
        logger,
      );

      const updatedUserPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitModel.findOne({
          where: { userId },
        });

      expect(updatedUserPixKeyDecodeLimit.limit).toBe(100);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - Should handle a error decoded pix key successfully', async () => {
      const { userId } =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitModel>(
          UserPixKeyDecodeLimitModel.name,
          { limit: 100, lastDecodedCreatedAt: new Date() },
        );

      const { id, state, key, type, personType } =
        await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
          { state: DecodedPixKeyState.ERROR, userId },
        );

      mockGetUserByUuidService.mockResolvedValue({ type: personType });

      const message: HandleNewDecodedPixKeyEventRequest = {
        id,
        state,
        key,
        type,
        personType,
        userId,
      };

      await controller.handleErrorDecodedPixKey(
        message,
        userLimitDecodedPixKeyRepository,
        userServiceKafka,
        logger,
      );

      const updatedUserPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitModel.findOne({
          where: { userId },
        });

      expect(updatedUserPixKeyDecodeLimit.limit).toBe(80);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - Should handle a pending decoded pix key successfully', async () => {
      const { userId } =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitModel>(
          UserPixKeyDecodeLimitModel.name,
          { limit: 100, lastDecodedCreatedAt: new Date() },
        );

      const { id, state, key, type, personType } =
        await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
          { state: DecodedPixKeyState.PENDING, userId },
        );

      mockGetUserByUuidService.mockResolvedValue({ type: personType });

      const message: HandleNewDecodedPixKeyEventRequest = {
        id,
        state,
        key,
        type,
        personType,
        userId,
      };

      await controller.handlePendingDecodedPixKey(
        message,
        userLimitDecodedPixKeyRepository,
        userServiceKafka,
        logger,
      );

      const updatedUserPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitModel.findOne({
          where: { userId },
        });

      expect(updatedUserPixKeyDecodeLimit.limit).toBe(99);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters.', () => {
    it('TC0004 - Should throw InvalidDataFormatException when invalid params.', async () => {
      const { state, key, type, personType, userId } =
        await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
          { state: DecodedPixKeyState.CONFIRMED },
        );

      const message: HandleNewDecodedPixKeyEventRequest = {
        id: '1',
        state,
        key,
        type,
        personType,
        userId,
      };

      const testScript = () =>
        controller.handleConfirmedDecodedPixKey(
          message,
          userLimitDecodedPixKeyRepository,
          userServiceKafka,
          logger,
        );

      await expect(testScript).rejects.toThrow(InvalidDataFormatException);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw UserNotFoundException when decodedPixKey user is not found.', async () => {
      const { id, state, key, type, userId } =
        await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
          { state: DecodedPixKeyState.CONFIRMED },
        );

      mockGetUserByUuidService.mockResolvedValue(null);

      const message: HandleNewDecodedPixKeyEventRequest = {
        id,
        state,
        key,
        type,
        userId,
      };

      const testScript = () =>
        controller.handleConfirmedDecodedPixKey(
          message,
          userLimitDecodedPixKeyRepository,
          userServiceKafka,
          logger,
        );

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
