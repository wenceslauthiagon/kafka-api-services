import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import {
  defaultLogger as logger,
  ForbiddenException,
  MissingDataException,
  getMoment,
} from '@zro/common';
import {
  KeyType,
  DecodedPixKeyEntity,
  PixKeyRepository,
  DecodedPixKeyRepository,
  UserPixKeyDecodeLimitRepository,
  PixKeyEntity,
  KeyState,
  UserPixKeyDecodeLimitEntity,
  DecodedPixKeyCacheRepository,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import { UserEntity } from '@zro/users/domain';
import {
  CreateDecodedPixKeyUseCase as UseCase,
  PixKeyGateway,
  UserService,
  DecodedPixKeyEventEmitter,
  MaxDecodePixKeyRequestsPerDayReachedException,
  DecodedPixKeyOwnedByUserException,
  InvalidCpfFormatException,
  InvalidCnpjFormatException,
  InvalidEvpFormatException,
  InvalidEmailFormatException,
  InvalidPhoneNumberFormatException,
  PixKeyNotFoundExceptionPspException,
  DecodedPixKeyNotFoundException,
} from '@zro/pix-keys/application';
import { UserNotFoundException } from '@zro/users/application';
import * as DecodedPixKeyPspGatewayMock from '@zro/test/pix-keys/config/mocks/decode_pix_key.mock';
import { UserFactory } from '@zro/test/users/config';
import {
  DecodedPixKeyFactory,
  PixKeyFactory,
  UserPixKeyDecodeLimitFactory,
} from '@zro/test/pix-keys/config';

const ZRO_ISPB = '26264220';
const naturalPersonBucketLimit = 100;
const legalPersonBucketLimit = 1000;
const temporalIncrementBucketInterval = 60;
const temporalIncrementBucket = 2;

describe('CreateDecodedPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const makeSut = () => {
    const {
      decodedPixKeyRepository,
      mockGetDecodedPixKeyById,
      pixKeyRepository,
      mockGetByKeyAndStateIsNotCanceled,
      decodedPixKeyCacheRepository,
      mockGetByHash,
      mockCreateHash,
      userPixKeyDecodeLimitRepository,
      mockGetUserPixKeyDecodeLimit,
    } = mockRepository();

    const { userService, mockGetUserByUuidService } = mockService();

    const { eventEmitter, mockPendingDecodedPixKeyEventEmitter } =
      mockEventEmitter();

    const { pspGateway, mockDecodePixKeyGateway } = mockGateway();

    const sut = new UseCase(
      logger,
      decodedPixKeyRepository,
      pixKeyRepository,
      decodedPixKeyCacheRepository,
      eventEmitter,
      userService,
      pspGateway,
      userPixKeyDecodeLimitRepository,
      ZRO_ISPB,
      naturalPersonBucketLimit,
      legalPersonBucketLimit,
      temporalIncrementBucketInterval,
      temporalIncrementBucket,
    );

    return {
      sut,
      mockGetDecodedPixKeyById,
      mockGetByKeyAndStateIsNotCanceled,
      mockGetUserPixKeyDecodeLimit,
      mockGetUserByUuidService,
      mockPendingDecodedPixKeyEventEmitter,
      mockDecodePixKeyGateway,
      mockGetByHash,
      mockCreateHash,
    };
  };

  const mockRepository = () => {
    const decodedPixKeyRepository: DecodedPixKeyRepository =
      createMock<DecodedPixKeyRepository>();
    const mockGetDecodedPixKeyById: jest.Mock = On(decodedPixKeyRepository).get(
      method((mock) => mock.getById),
    );

    const pixKeyRepository: PixKeyRepository = createMock<PixKeyRepository>();
    const mockGetByKeyAndStateIsNotCanceled: jest.Mock = On(
      pixKeyRepository,
    ).get(method((mock) => mock.getByKeyAndStateIsNotCanceled));

    const userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository =
      createMock<UserPixKeyDecodeLimitRepository>();
    const mockGetUserPixKeyDecodeLimit: jest.Mock = On(
      userPixKeyDecodeLimitRepository,
    ).get(method((mock) => mock.getByUser));

    const decodedPixKeyCacheRepository: DecodedPixKeyCacheRepository =
      createMock<DecodedPixKeyCacheRepository>();
    const mockGetByHash: jest.Mock = On(decodedPixKeyCacheRepository).get(
      method((mock) => mock.getByHash),
    );
    const mockCreateHash: jest.Mock = On(decodedPixKeyCacheRepository).get(
      method((mock) => mock.createHash),
    );

    return {
      decodedPixKeyRepository,
      mockGetDecodedPixKeyById,
      pixKeyRepository,
      mockGetByKeyAndStateIsNotCanceled,
      decodedPixKeyCacheRepository,
      mockGetByHash,
      mockCreateHash,
      userPixKeyDecodeLimitRepository,
      mockGetUserPixKeyDecodeLimit,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );

    return {
      userService,
      mockGetUserByUuidService,
    };
  };

  const mockEventEmitter = () => {
    const eventEmitter: DecodedPixKeyEventEmitter =
      createMock<DecodedPixKeyEventEmitter>();
    const mockPendingDecodedPixKeyEventEmitter: jest.Mock = On(
      eventEmitter,
    ).get(method((mock) => mock.pendingDecodedPixKey));

    return {
      eventEmitter,
      mockPendingDecodedPixKeyEventEmitter,
    };
  };

  const mockGateway = () => {
    const pspGateway: PixKeyGateway = createMock<PixKeyGateway>();
    const mockDecodePixKeyGateway: jest.Mock = On(pspGateway).get(
      method((mock) => mock.decodePixKey),
    );

    return {
      pspGateway,
      mockDecodePixKeyGateway,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScripts = [
        () => sut.execute(null, null, null, null),
        () => sut.execute(null, user, faker.datatype.uuid(), KeyType.EVP),
        () =>
          sut.execute(
            faker.datatype.uuid(),
            null,
            faker.datatype.uuid(),
            KeyType.EVP,
          ),
        () => sut.execute(faker.datatype.uuid(), user, null, KeyType.EVP),
        () =>
          sut.execute(faker.datatype.uuid(), user, faker.datatype.uuid(), null),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);

        expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
        expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
        expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
        expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
        expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
        expect(mockGetByHash).toHaveBeenCalledTimes(0);
        expect(mockCreateHash).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw InvalidCnpjFormatException when CPF key is invalid.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          faker.datatype.uuid(),
          KeyType.CPF,
        );

      await expect(testScript).rejects.toThrow(InvalidCpfFormatException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw InvalidCnpjFormatException when CNPJ key is invalid.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          faker.datatype.uuid(),
          KeyType.CNPJ,
        );

      await expect(testScript).rejects.toThrow(InvalidCnpjFormatException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw InvalidCnpjFormatException when EVP key is invalid.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          faker.datatype.string(),
          KeyType.EVP,
        );

      await expect(testScript).rejects.toThrow(InvalidEvpFormatException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should throw InvalidCnpjFormatException when EMAIL key is invalid.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          faker.datatype.uuid(),
          KeyType.EMAIL,
        );

      await expect(testScript).rejects.toThrow(InvalidEmailFormatException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should throw InvalidCnpjFormatException when PHONE key is invalid.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () =>
        sut.execute(
          faker.datatype.uuid(),
          user,
          '+XXXXXX' + faker.datatype.number(999999).toString().padStart(6, '0'),
          KeyType.PHONE,
        );

      await expect(testScript).rejects.toThrow(
        InvalidPhoneNumberFormatException,
      );

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(0);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should throw ForbiddenException if decoded pix key user is not the current user.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user: new UserEntity({ uuid: faker.datatype.uuid() }) },
        );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(decodedPixKey);

      const testScript = () =>
        sut.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
        );

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should throw UserNotFoundException if decoded pix key user is not found or inactive.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(null);

      const testScript = () =>
        sut.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
        );

      await expect(testScript).rejects.toThrow(UserNotFoundException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should throw MaxDecodePixKeyRequestsPerDayReachedException if user has not enough pix key decode limit.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { user, limit: 0, lastDecodedCreatedAt: getMoment().toDate() },
        );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(userPixKeyDecodeLimit);

      const testScript = () =>
        sut.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
        );

      await expect(testScript).rejects.toThrow(
        MaxDecodePixKeyRequestsPerDayReachedException,
      );

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should throw DecodedPixKeyOwnedByUserException if user is trying to limit his own key.', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { user, state: KeyState.READY },
      );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);

      const testScript = () =>
        sut.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
        );

      await expect(testScript).rejects.toThrow(
        DecodedPixKeyOwnedByUserException,
      );

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should not limit if remote pix key is not found', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );

      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          {
            user,
            limit: 0,
            lastDecodedCreatedAt: getMoment().subtract(1, 'minute').toDate(),
          },
        );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(userPixKeyDecodeLimit);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);
      mockDecodePixKeyGateway.mockRejectedValueOnce(
        new PixKeyNotFoundExceptionPspException(new Error()),
      );
      mockGetByHash.mockResolvedValue(null);

      const testScript = () =>
        sut.execute(
          decodedPixKey.id,
          user,
          decodedPixKey.key,
          decodedPixKey.type,
        );

      await expect(testScript).rejects.toThrow(DecodedPixKeyNotFoundException);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0013 - Should not limit if decoded pix key is already created', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const decodedPixKey = new DecodedPixKeyEntity({
        id: faker.datatype.uuid(),
        key: faker.datatype.uuid(),
        state: DecodedPixKeyState.PENDING,
        type: KeyType.EVP,
        user,
      });

      mockGetDecodedPixKeyById.mockResolvedValueOnce(decodedPixKey);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toMatchObject(decodedPixKey);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(0);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockGetByHash).toHaveBeenCalledTimes(0);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0014 - Should create a local decoded pix key successfully if a pix key is found', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);
      mockDecodePixKeyGateway.mockImplementationOnce(
        DecodedPixKeyPspGatewayMock.success,
      );
      mockGetByHash.mockResolvedValue(null);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.state).toBe(DecodedPixKeyState.PENDING);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(1);
    });

    it('TC0015 - Should limit and create a remote pix key successfully if no pix key is found', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([]);
      mockDecodePixKeyGateway.mockImplementationOnce(
        DecodedPixKeyPspGatewayMock.success,
      );
      mockGetByHash.mockResolvedValue(null);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.state).toBe(DecodedPixKeyState.PENDING);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(1);
    });

    it('TC0016 - Should limit and create a remote pix key successfully if found key owner (user) is not active', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const ownerUser = await UserFactory.create<UserEntity>(UserEntity.name, {
        active: false,
      });
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY, user: ownerUser },
      );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);
      mockDecodePixKeyGateway.mockImplementationOnce(
        DecodedPixKeyPspGatewayMock.success,
      );
      mockGetByHash.mockResolvedValue(null);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.state).toBe(DecodedPixKeyState.PENDING);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(1);
    });

    it('TC0017 - Should limit and create a remote pix key successfully if pix key number is greater than global limit but user limit is less', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { limit: naturalPersonBucketLimit },
        );
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );

      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(userPixKeyDecodeLimit);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);
      mockDecodePixKeyGateway.mockImplementationOnce(
        DecodedPixKeyPspGatewayMock.success,
      );
      mockGetByHash.mockResolvedValue(null);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.state).toBe(DecodedPixKeyState.PENDING);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(1);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(1);
    });

    it('TC0018 - Should Get decodedPixKey from cache', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { limit: naturalPersonBucketLimit },
        );
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.READY },
      );
      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(userPixKeyDecodeLimit);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);
      mockGetByHash.mockResolvedValue(decodedPixKey);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.endToEndId).toBeUndefined();
      expect(result.state).toBe(DecodedPixKeyState.PENDING);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(2);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });

    it('TC0019 - Should Get decodedPixKey from cache with request endToEndId', async () => {
      const {
        sut,
        mockGetDecodedPixKeyById,
        mockGetByKeyAndStateIsNotCanceled,
        mockGetUserPixKeyDecodeLimit,
        mockGetUserByUuidService,
        mockPendingDecodedPixKeyEventEmitter,
        mockDecodePixKeyGateway,
        mockGetByHash,
        mockCreateHash,
      } = makeSut();

      const user = await UserFactory.create<UserEntity>(UserEntity.name);
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { limit: naturalPersonBucketLimit, user },
        );
      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        { state: KeyState.NOT_CONFIRMED },
      );
      mockGetDecodedPixKeyById.mockResolvedValueOnce(null);
      mockGetUserByUuidService.mockResolvedValueOnce(user);
      mockGetUserPixKeyDecodeLimit.mockResolvedValueOnce(userPixKeyDecodeLimit);
      mockGetByKeyAndStateIsNotCanceled.mockResolvedValueOnce([pixKey]);
      mockGetByHash.mockResolvedValue(decodedPixKey);

      const result = await sut.execute(
        decodedPixKey.id,
        user,
        decodedPixKey.key,
        decodedPixKey.type,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.state).toBe(DecodedPixKeyState.PENDING);

      expect(mockGetDecodedPixKeyById).toHaveBeenCalledTimes(1);
      expect(mockGetByKeyAndStateIsNotCanceled).toHaveBeenCalledTimes(1);
      expect(mockGetUserPixKeyDecodeLimit).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockDecodePixKeyGateway).toHaveBeenCalledTimes(0);
      expect(mockPendingDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      expect(mockGetByHash).toHaveBeenCalledTimes(1);
      expect(mockCreateHash).toHaveBeenCalledTimes(0);
    });
  });
});
