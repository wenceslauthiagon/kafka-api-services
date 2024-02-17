import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  ForbiddenException,
  MissingDataException,
} from '@zro/common';
import { UserEntity, OnboardingEntity, PersonType } from '@zro/users/domain';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  PixKeyUnsupportedCnpjTypeException,
  CreatePixKeyUseCase as UseCase,
  PixKeyEventEmitter,
  UserService,
  InvalidEmailFormatException,
  InvalidPhoneNumberFormatException,
  InvalidDocumentFormatException,
  MaxNumberOfPixKeysReachedException,
  PixKeyAlreadyCreatedException,
} from '@zro/pix-keys/application';
import {
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  PixKeyDatabaseRepository,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { OnboardingFactory, UserFactory } from '@zro/test/users/config';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

const APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS = 5;
const APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS = 20;

describe('CreatePixKeyUseCase', () => {
  let module: TestingModule;
  let pixKeyRepository: PixKeyRepository;

  const userService: UserService = createMock<UserService>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );

  const pixKeyEventService: PixKeyEventEmitter =
    createMock<PixKeyEventEmitter>();
  const mockConfirmedPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.confirmedPixKey),
  );
  const mockPendingPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.pendingPixKey),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create EVP key successfully', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      const result = await usecase.execute(id, user, KeyType.EVP);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.key).toBeNull();
      expect(result.state).toBe(KeyState.CONFIRMED);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should get EVP key if id already exists', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        userId: user.uuid,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const result = await usecase.execute(pixKey.id, user, KeyType.EVP);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.user.uuid).toBe(pixKey.userId);
      expect(result.key).toBeDefined();
      expect(result.state).toBe(pixKey.state);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should create PHONE with Country, DDD and 9', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        uuid: pixKey.userId,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const key = '+5581912345678';

      const result = await usecase.execute(pixKey.id, user, KeyType.PHONE, key);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.key).toBeDefined();
      expect(result.state).toBe(pixKey.state);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should create phone number key', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      const key = '+1181123456789';

      const result = await usecase.execute(id, user, KeyType.PHONE, key);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.key).toBeDefined();
      expect(result.state).toBe(KeyState.PENDING);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(1);
    });

    it('TC0005 - Should create PHONE with Country', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        uuid: pixKey.userId,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const key = '+1181123456789';

      const result = await usecase.execute(pixKey.id, user, KeyType.PHONE, key);

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKey.id);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.key).toBeDefined();
      expect(result.state).toBe(pixKey.state);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should create CPF key', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );
      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();
      const key = '422.547.080-66';

      const result = await usecase.execute(id, user, KeyType.CPF, key);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.user.uuid).toBe(user.uuid);
      expect(result.key).toBeDefined();
      expect(result.state).toBe(KeyState.CONFIRMED);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(1);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0007 - Should not create EVP key if another user has this key id', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

      const user = await UserFactory.create<UserEntity>(UserEntity.name, {});

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const testScript = () => usecase.execute(pixKey.id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
    it('TC0008 - Should not create pix key if missing data', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const id = faker.datatype.uuid();

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const results = [
        usecase.execute(null, null, null),
        usecase.execute(id, null, null),
        usecase.execute(null, user, null),
        usecase.execute(id, null, KeyType.EVP),
        usecase.execute(null, null, KeyType.EVP),
        usecase.execute(id, user, null),
      ];

      for (const result of results) {
        await expect(result).rejects.toThrow(MissingDataException);
      }
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not create CNPJ key', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const testScript = () =>
        usecase.execute(faker.datatype.uuid(), user, KeyType.CNPJ);

      await expect(testScript).rejects.toThrow(
        PixKeyUnsupportedCnpjTypeException,
      );
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should not create email key if is invalid format', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();
      const key = faker.datatype.string();

      const testScript = () => usecase.execute(id, user, KeyType.EMAIL, key);

      await expect(testScript).rejects.toThrow(InvalidEmailFormatException);

      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not create phone number key if is invalid format', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();
      const key = String(faker.datatype.number());

      const testScript = () => usecase.execute(id, user, KeyType.PHONE, key);

      await expect(testScript).rejects.toThrow(
        InvalidPhoneNumberFormatException,
      );
      expect(mockGetUserService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0012 - Should not create key if user not found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      mockGetUserService.mockResolvedValueOnce(null);

      const testScript = () => usecase.execute(id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(UserNotFoundException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0013 - Should not create key if user not have document or full name', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        document: null,
      });

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      mockGetUserService.mockResolvedValueOnce(user);

      const testScript = () => usecase.execute(id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0014 - Should not create key if onboarding not found', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(null);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      const testScript = () => usecase.execute(id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0015 - Should not create key if onboarding not have account number or branch', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const onboarding = await UserFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
        {
          accountNumber: null,
        },
      );

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      const testScript = () => usecase.execute(id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0016 - Should not create key if document format is invalid', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();
      const key = faker.datatype.string();

      const testScript = () => usecase.execute(id, user, KeyType.CPF, key);

      await expect(testScript).rejects.toThrow(InvalidDocumentFormatException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0017 - Should not create key if user is natural person and max number of keys has been reached', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      await PixKeyFactory.createMany<PixKeyModel>(PixKeyModel.name, 6, {
        userId: user.uuid,
      });

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      const testScript = () => usecase.execute(id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(
        MaxNumberOfPixKeysReachedException,
      );
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0018 - Should not create key if user is legal person and max number of keys has been reached', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name, {
        type: PersonType.LEGAL_PERSON,
      });

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      await PixKeyFactory.createMany<PixKeyModel>(PixKeyModel.name, 21, {
        userId: user.uuid,
      });

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();

      const testScript = () => usecase.execute(id, user, KeyType.EVP);

      await expect(testScript).rejects.toThrow(
        MaxNumberOfPixKeysReachedException,
      );
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });

    it('TC0019 - Should not create key if user is trying to add same key', async () => {
      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const onboarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        type: KeyType.PHONE,
        key: '+5581912345678',
        userId: user.uuid,
      });

      mockGetUserService.mockResolvedValueOnce(user);
      mockGetOnboardingService.mockResolvedValueOnce(onboarding);

      const usecase = new UseCase(
        logger,
        pixKeyRepository,
        userService,
        pixKeyEventService,
        APP_NATURAL_PERSON_MAX_NUMBER_OF_KEYS,
        APP_LEGAL_PERSON_MAX_NUMBER_OF_KEYS,
      );

      const id = faker.datatype.uuid();
      const key = pixKey.key;

      const testScript = () => usecase.execute(id, user, KeyType.PHONE, key);

      await expect(testScript).rejects.toThrow(PixKeyAlreadyCreatedException);
      expect(mockGetUserService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockConfirmedPixKeyEvent).toHaveBeenCalledTimes(0);
      expect(mockPendingPixKeyEvent).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
