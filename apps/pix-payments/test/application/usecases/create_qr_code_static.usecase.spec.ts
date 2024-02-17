import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  ForbiddenException,
  MissingDataException,
} from '@zro/common';
import { KeyState, KeyType, PixKeyEntity } from '@zro/pix-keys/domain';
import { AddressEntity, OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  AddressNotFoundException,
  OnboardingNotFoundException,
} from '@zro/users/application';
import {
  CreateQrCodeStaticUseCase as UseCase,
  UserService,
  PixKeyService,
  QrCodeStaticEventEmitter,
} from '@zro/pix-payments/application';
import {
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('CreateQrCodeStaticUseCase', () => {
  let module: TestingModule;

  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitter =
    createMock<QrCodeStaticEventEmitter>();
  const mockPendingEventEmitter: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.pendingQrCodeStatic),
  );

  const userService: UserService = createMock<UserService>();
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );
  const mockGetAddressService: jest.Mock = On(userService).get(
    method((mock) => mock.getAddressById),
  );

  const pixKeyService: PixKeyService = createMock<PixKeyService>();
  const mockGetPixKeyByIdService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.getPixKeyByIdAndUser),
  );
  const mockGetPixKeyByKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.getPixKeyByKeyAndUser),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - should create qrCodeStatic with pixKey ID successfully', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        key: faker.datatype.uuid(),
        type: KeyType.EVP,
        state: KeyState.READY,
      });
      const address = new AddressEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        city: faker.address.cityName(),
      });
      const onboarding = new OnboardingEntity({
        id: faker.datatype.uuid(),
        fullName: faker.datatype.uuid(),
        address,
      });
      mockGetPixKeyByIdService.mockResolvedValue(pixKey);
      mockGetAddressService.mockResolvedValue(address);
      mockGetOnboardingService.mockResolvedValue(onboarding);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const pixKeyParam = new PixKeyEntity({ id: pixKey.id });
      const result = await usecase.execute(id, user, pixKeyParam);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.emv).toBeUndefined();
      expect(result.txId).toBeDefined();
      expect(result.summary).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.pixKey.id).toBe(pixKey.id);
      expect(result.documentValue).toBeUndefined();
      expect(result.state).toBe(QrCodeStaticState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0002 - should create qrCodeStatic with pixKey key successfully', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        key: faker.datatype.uuid(),
        type: KeyType.EVP,
        state: KeyState.READY,
      });
      const address = new AddressEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        city: faker.address.cityName(),
      });
      const onboarding = new OnboardingEntity({
        id: faker.datatype.uuid(),
        fullName: faker.datatype.uuid(),
        address,
      });
      mockGetPixKeyByKeyService.mockResolvedValue(pixKey);
      mockGetAddressService.mockResolvedValue(address);
      mockGetOnboardingService.mockResolvedValue(onboarding);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const pixKeyParam = new PixKeyEntity({ key: pixKey.key });
      const result = await usecase.execute(id, user, pixKeyParam);

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.emv).toBeUndefined();
      expect(result.txId).toBeDefined();
      expect(result.summary).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.pixKey.id).toBe(pixKey.id);
      expect(result.documentValue).toBeUndefined();
      expect(result.state).toBe(QrCodeStaticState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0003 - should create qrCodeStatic with every params successfully', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        key: faker.datatype.uuid(),
        type: KeyType.EVP,
        state: KeyState.READY,
      });
      const address = new AddressEntity({
        id: faker.datatype.number({ min: 1, max: 99999 }),
        city: faker.address.cityName(),
      });
      const onboarding = new OnboardingEntity({
        id: faker.datatype.uuid(),
        fullName: faker.datatype.uuid(),
        address,
      });
      mockGetPixKeyByKeyService.mockResolvedValue(pixKey);
      mockGetAddressService.mockResolvedValue(address);
      mockGetOnboardingService.mockResolvedValue(onboarding);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const pixKeyParam = new PixKeyEntity({ key: pixKey.key });
      const documentValue = faker.datatype.number();
      const summary = faker.datatype.string();
      const description = faker.datatype.string();
      const result = await usecase.execute(
        id,
        user,
        pixKeyParam,
        documentValue,
        summary,
        description,
        faker.datatype.string(),
        faker.date.recent(),
        faker.datatype.boolean(),
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(id);
      expect(result.emv).toBeUndefined();
      expect(result.txId).toBeDefined();
      expect(result.summary).toBe(summary);
      expect(result.description).toBe(description);
      expect(result.pixKey.id).toBe(pixKey.id);
      expect(result.documentValue).toBe(documentValue);
      expect(result.state).toBe(QrCodeStaticState.PENDING);
      expect(result.createdAt).toBeDefined();
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - should get the created qrCodeStatic', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
      );
      const user = new UserEntity({ uuid: qrCodeStatic.userId });
      const pixKey = new PixKeyEntity({ id: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const result = await usecase.execute(qrCodeStatic.id, user, pixKey);

      expect(result).toBeDefined();
      expect(result).toMatchObject(qrCodeStatic.toDomain());
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create the qrCodeStatic if another user has this qrCodeStatic id', async () => {
      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
      );
      const pixKey = new PixKeyEntity({ id: faker.datatype.uuid() });

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const user = new UserEntity({ uuid: faker.datatype.uuid() });

      const testScript = () => usecase.execute(qrCodeStatic.id, user, pixKey);

      await expect(testScript).rejects.toThrow(ForbiddenException);
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if pixKey is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({ id: faker.datatype.uuid() });
      mockGetPixKeyByIdService.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, pixKey);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if pixKey is not ready state', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        state: KeyState.CONFIRMED,
      });
      mockGetPixKeyByIdService.mockResolvedValue(pixKey);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, pixKey);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create if onboarding is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        state: KeyState.READY,
      });
      mockGetPixKeyByIdService.mockResolvedValue(pixKey);
      mockGetOnboardingService.mockResolvedValue(null);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, pixKey);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not create if onboarding has no fullName', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        state: KeyState.READY,
      });
      const onboarding = new OnboardingEntity({ id: faker.datatype.uuid() });
      mockGetPixKeyByIdService.mockResolvedValue(pixKey);
      mockGetOnboardingService.mockResolvedValue(onboarding);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, pixKey);

      await expect(testScript).rejects.toThrow(MissingDataException);
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0010 - Should not create if address is not found', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const pixKey = new PixKeyEntity({
        id: faker.datatype.uuid(),
        state: KeyState.READY,
      });
      const onboarding = new OnboardingEntity({
        id: faker.datatype.uuid(),
        fullName: faker.datatype.uuid(),
      });
      mockGetPixKeyByIdService.mockResolvedValue(pixKey);
      mockGetOnboardingService.mockResolvedValue(onboarding);

      const usecase = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const id = faker.datatype.uuid();
      const testScript = () => usecase.execute(id, user, pixKey);

      await expect(testScript).rejects.toThrow(AddressNotFoundException);
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0011 - Should not create if params are missing', async () => {
      const user = new UserEntity({ uuid: faker.datatype.uuid() });
      const id = faker.datatype.uuid();

      const sut = new UseCase(
        logger,
        qrCodeStaticRepository,
        userService,
        pixKeyService,
        eventEmitter,
      );

      const test = [
        () =>
          sut.execute(
            null,
            user,
            new PixKeyEntity({ id: faker.datatype.uuid() }),
          ),
        sut.execute(id, null, new PixKeyEntity({ id: faker.datatype.uuid() })),
        sut.execute(id, user, null),
        sut.execute(id, user, new PixKeyEntity({})),
        sut.execute(id, null, new PixKeyEntity({ key: faker.datatype.uuid() })),
        sut.execute(
          id,
          user,
          new PixKeyEntity({ key: faker.datatype.uuid() }),
          null,
          null,
          null,
          null,
          null,
          false,
        ),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }
      expect(mockGetPixKeyByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetPixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
