import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { MissingDataException, defaultLogger as logger } from '@zro/common';
import {
  UserPixKeyDecodeLimitRepository,
  DecodedPixKeyEntity,
  UserPixKeyDecodeLimitEntity,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import { UserNotFoundException } from '@zro/users/application';
import {
  HandleNewDecodedPixKeyEventUseCase as UseCase,
  DecodedPixKeyInvalidStateException,
  UserService,
} from '@zro/pix-keys/application';
import {
  DecodedPixKeyFactory,
  UserPixKeyDecodeLimitFactory,
} from '@zro/test/pix-keys/config';

describe('GetHistoryByIdPixKeyUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

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

  const mockRepository = () => {
    const userLimitDecodedPixKeyRepository =
      createMock<UserPixKeyDecodeLimitRepository>();
    const mockGetByUserRepository: jest.Mock = On(
      userLimitDecodedPixKeyRepository,
    ).get(method((mock) => mock.getByUser));
    const mockCreateOrUpdateRepository: jest.Mock = On(
      userLimitDecodedPixKeyRepository,
    ).get(method((mock) => mock.createOrUpdate));

    return {
      userLimitDecodedPixKeyRepository,
      mockGetByUserRepository,
      mockCreateOrUpdateRepository,
    };
  };

  const makeSut = () => {
    const {
      userLimitDecodedPixKeyRepository,
      mockGetByUserRepository,
      mockCreateOrUpdateRepository,
    } = mockRepository();

    const { userService, mockGetUserByUuidService } = mockService();

    const naturalPersonBucketLimit = 100;
    const legalPersonBucketLimit = 1000;
    const temporalIncrementBucket = 2;
    const temporalIncrementBucketInterval = 60;
    const validTryDecrementOrIncrementBucket = 1;
    const invalidTryDecrementBucket = 20;

    const sut = new UseCase(
      logger,
      userLimitDecodedPixKeyRepository,
      userService,
      naturalPersonBucketLimit,
      legalPersonBucketLimit,
      temporalIncrementBucket,
      temporalIncrementBucketInterval,
      validTryDecrementOrIncrementBucket,
      invalidTryDecrementBucket,
    );

    return {
      sut,
      mockGetByUserRepository,
      mockCreateOrUpdateRepository,
      mockGetUserByUuidService,
      validTryDecrementOrIncrementBucket,
      invalidTryDecrementBucket,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should throw MissingDataException when missing params.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
        );

      const testScripts = [
        () => sut.execute(null),
        () => sut.execute({ ...decodedPixKey, id: null }),
        () => sut.execute({ ...decodedPixKey, user: null }),
      ];

      for (const testScript of testScripts) {
        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
        expect(mockGetByUserRepository).toHaveBeenCalledTimes(0);
        expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(0);
      }
    });

    it('TC0002 - Should throw UserNotFoundException when decodedPixKey user is not found.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
        );

      mockGetUserByUuidService.mockResolvedValue(null);

      const testScript = () => sut.execute(decodedPixKey);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should throw MissingDataException when decodedPixKey user has no type.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
        );

      mockGetUserByUuidService.mockResolvedValue({});

      const testScript = () => sut.execute(decodedPixKey);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(0);
      expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should throw DecodedPixKeyInvalidStateException when decodedPixKey state is invalid.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { state: 'INVALID_STATE' as DecodedPixKeyState },
        );
      decodedPixKey.user.type = decodedPixKey.personType;

      mockGetUserByUuidService.mockResolvedValue(decodedPixKey.user);

      const testScript = () => sut.execute(decodedPixKey);

      await expect(testScript).rejects.toThrow(
        DecodedPixKeyInvalidStateException,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0005 - Should handle an ERROR decoded pix key successfully.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
        invalidTryDecrementBucket,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { state: DecodedPixKeyState.ERROR },
        );
      decodedPixKey.user.type = decodedPixKey.personType;

      const limit = 100;
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { limit, lastDecodedCreatedAt: new Date() },
        );

      mockGetUserByUuidService.mockResolvedValue(decodedPixKey.user);
      mockGetByUserRepository.mockResolvedValue(userPixKeyDecodeLimit);

      await sut.execute(decodedPixKey);

      expect(userPixKeyDecodeLimit.limit).toBe(
        limit - invalidTryDecrementBucket,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0006 - Should handle an CONFIRMED decoded pix key successfully.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
        validTryDecrementOrIncrementBucket,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { state: DecodedPixKeyState.CONFIRMED },
        );
      decodedPixKey.user.type = decodedPixKey.personType;

      const limit = 100;
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { limit, lastDecodedCreatedAt: new Date() },
        );

      mockGetUserByUuidService.mockResolvedValue(decodedPixKey.user);
      mockGetByUserRepository.mockResolvedValue(userPixKeyDecodeLimit);

      await sut.execute(decodedPixKey);

      expect(userPixKeyDecodeLimit.limit).toBe(
        limit + validTryDecrementOrIncrementBucket,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(1);
    });

    it('TC0007 - Should handle an PENDING decoded pix key successfully.', async () => {
      const {
        sut,
        mockGetByUserRepository,
        mockCreateOrUpdateRepository,
        mockGetUserByUuidService,
        validTryDecrementOrIncrementBucket,
      } = makeSut();

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { state: DecodedPixKeyState.PENDING },
        );
      decodedPixKey.user.type = decodedPixKey.personType;

      const limit = 100;
      const userPixKeyDecodeLimit =
        await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitEntity>(
          UserPixKeyDecodeLimitEntity.name,
          { limit, lastDecodedCreatedAt: new Date() },
        );

      mockGetUserByUuidService.mockResolvedValue(decodedPixKey.user);
      mockGetByUserRepository.mockResolvedValue(userPixKeyDecodeLimit);

      await sut.execute(decodedPixKey);

      expect(userPixKeyDecodeLimit.limit).toBe(
        limit - validTryDecrementOrIncrementBucket,
      );
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetByUserRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateRepository).toHaveBeenCalledTimes(1);
    });
  });
});
