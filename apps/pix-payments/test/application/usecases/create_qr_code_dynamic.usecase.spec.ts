import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  MissingDataException,
  defaultLogger as logger,
  ForbiddenException,
} from '@zro/common';
import {
  AddressNotFoundException,
  OnboardingNotFoundException,
  UserNotFoundException,
} from '@zro/users/application';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import { KeyState, PixKeyEntity } from '@zro/pix-keys/domain';
import { AddressEntity, OnboardingEntity, UserEntity } from '@zro/users/domain';
import {
  QrCodeDynamicEntity,
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  CreateQrCodeDynamicUseCase as UseCase,
  UserService,
  PixKeyService,
  QrCodeDynamicEventEmitter,
} from '@zro/pix-payments/application';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import {
  AddressFactory,
  OnboardingFactory,
  UserFactory,
} from '@zro/test/users/config';

describe('CreateQrCodeDynamicEventUseCase', () => {
  beforeEach(() => jest.resetAllMocks());
  afterAll(() => jest.restoreAllMocks());

  const mockEmitter = () => {
    const eventEmitter: QrCodeDynamicEventEmitter =
      createMock<QrCodeDynamicEventEmitter>();
    const mockPendingEventEmitter: jest.Mock = On(eventEmitter).get(
      method((mock) => mock.pendingQrCodeDynamic),
    );

    return {
      eventEmitter,
      mockPendingEventEmitter,
    };
  };

  const mockRepository = () => {
    const qrCodeDynamicRepository: QrCodeDynamicRepository =
      createMock<QrCodeDynamicRepository>();
    const mockGetQrCodeDynamicByIdRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.getById));
    const mockCreateQrCodeDynamicRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.create));
    const mockCreateQrCodeDynamicDueDateRepository: jest.Mock = On(
      qrCodeDynamicRepository,
    ).get(method((mock) => mock.create));

    return {
      qrCodeDynamicRepository,
      mockCreateQrCodeDynamicRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockCreateQrCodeDynamicDueDateRepository,
    };
  };

  const mockService = () => {
    const userService: UserService = createMock<UserService>();
    const mockGetUserByUuidService: jest.Mock = On(userService).get(
      method((mock) => mock.getUserByUuid),
    );
    const mockGetOnboardingService: jest.Mock = On(userService).get(
      method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
    );
    const mockGetAddressByIdService: jest.Mock = On(userService).get(
      method((mock) => mock.getAddressById),
    );

    const pixKeyService: PixKeyService = createMock<PixKeyService>();
    const mockGetpixKeyByKeyService: jest.Mock = On(pixKeyService).get(
      method((mock) => mock.getPixKeyByKeyAndUser),
    );

    return {
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      mockGetAddressByIdService,
      pixKeyService,
      mockGetpixKeyByKeyService,
    };
  };

  const makeSut = () => {
    const {
      qrCodeDynamicRepository,
      mockCreateQrCodeDynamicRepository,
      mockCreateQrCodeDynamicDueDateRepository,
      mockGetQrCodeDynamicByIdRepository,
    } = mockRepository();
    const { eventEmitter, mockPendingEventEmitter } = mockEmitter();
    const {
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      mockGetAddressByIdService,
      pixKeyService,
      mockGetpixKeyByKeyService,
    } = mockService();

    const sut = new UseCase(
      logger,
      qrCodeDynamicRepository,
      userService,
      pixKeyService,
      eventEmitter,
    );
    return {
      sut,
      qrCodeDynamicRepository,
      mockCreateQrCodeDynamicRepository,
      mockCreateQrCodeDynamicDueDateRepository,
      mockGetQrCodeDynamicByIdRepository,
      mockPendingEventEmitter,
      userService,
      mockGetUserByUuidService,
      mockGetOnboardingService,
      mockGetAddressByIdService,
      pixKeyService,
      mockGetpixKeyByKeyService,
    };
  };

  describe('With invalid parameters', () => {
    it('TC0001 - Should not create if missing params', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const test = [
        () => sut.execute(null),
        () => sut.execute({ ...qrCodeDynamic, id: null }),
        () => sut.execute({ ...qrCodeDynamic, user: null }),
        () =>
          sut.execute({
            ...qrCodeDynamic,
            user: new UserEntity({ uuid: null }),
          }),
        () =>
          sut.execute({
            ...qrCodeDynamic,
            pixKey: null,
          }),
        () =>
          sut.execute({
            ...qrCodeDynamic,
            pixKey: new PixKeyEntity({ key: null }),
          }),
      ];

      for (const i of test) {
        await expect(i).rejects.toThrow(MissingDataException);
      }

      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0002 - Should not create if exists qr code dynamic (Due Date)with different user', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicDueDateRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce({
        ...qrCodeDynamic,
        user: new UserEntity({
          uuid: 'any_id',
        }),
      });

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicDueDateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0003 - Should not create if exists qr code dynamic with different user', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce({
        ...qrCodeDynamic,
        user: new UserEntity({
          uuid: 'any_id',
        }),
      });

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(ForbiddenException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0004 - Should not create if pix key not found', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0005 - Should not create if pix key not ready', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.CANCELED,
        },
      );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0006 - Should not create if user not found', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.READY,
        },
      );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetUserByUuidService.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(UserNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0007 - Should not create if onboarding not found', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          'QrCodeDynamicEntity',
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const pixKey = await PixKeyFactory.create<PixKeyEntity>('PixKeyEntity', {
        state: KeyState.READY,
      });

      mockGetUserByUuidService.mockResolvedValueOnce(user);

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      mockGetOnboardingService.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(OnboardingNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0008 - Should not create if onboarding not has address', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.READY,
        },
      );

      mockGetUserByUuidService.mockResolvedValueOnce(user);

      const onBoarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
      );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      mockGetOnboardingService.mockResolvedValueOnce(onBoarding);

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(AddressNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0009 - Should not create if address not found', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const address = await AddressFactory.create<AddressEntity>(
        AddressEntity.name,
      );

      const onBoarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
        {
          address,
        },
      );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.READY,
        },
      );

      mockGetUserByUuidService.mockResolvedValueOnce(user);

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      mockGetOnboardingService.mockResolvedValueOnce(onBoarding);

      mockGetAddressByIdService.mockResolvedValueOnce(null);

      const testScript = () => sut.execute(qrCodeDynamic);

      await expect(testScript).rejects.toThrow(AddressNotFoundException);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });
  });

  describe('With valid parameters', () => {
    it('TC0010 - should create qr code dynamic successfully', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const address = await AddressFactory.create<AddressEntity>(
        AddressEntity.name,
      );

      const onBoarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
        { address },
      );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.READY,
        },
      );

      mockGetUserByUuidService.mockResolvedValueOnce(user);

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      mockGetOnboardingService.mockResolvedValueOnce(onBoarding);

      mockGetAddressByIdService.mockResolvedValueOnce(address);

      const result = await sut.execute(qrCodeDynamic);

      expect(result).toBeDefined();
      expect(result.expirationDate).toBeDefined();
      expect(result.allowUpdate).toEqual(false);
      expect(result.state).toEqual(PixQrCodeDynamicState.PENDING);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0011 - should create qr code dynamic (Due Date) successfully', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicDueDateRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      const address = await AddressFactory.create<AddressEntity>(
        AddressEntity.name,
      );

      const onBoarding = await OnboardingFactory.create<OnboardingEntity>(
        OnboardingEntity.name,
        { address },
      );

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const pixKey = await PixKeyFactory.create<PixKeyEntity>(
        PixKeyEntity.name,
        {
          state: KeyState.READY,
        },
      );

      mockGetUserByUuidService.mockResolvedValueOnce(user);

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(null);

      mockGetpixKeyByKeyService.mockResolvedValueOnce(pixKey);

      mockGetOnboardingService.mockResolvedValueOnce(onBoarding);

      mockGetAddressByIdService.mockResolvedValueOnce(address);

      const result = await sut.execute(qrCodeDynamic);

      expect(result).toBeDefined();
      expect(result.expirationDate).toBeDefined();
      expect(result.allowUpdate).toEqual(false);
      expect(result.state).toEqual(PixQrCodeDynamicState.PENDING);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicDueDateRepository).toHaveBeenCalledTimes(1);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(1);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(1);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(1);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(1);
    });

    it('TC0012 - should return qr code dynamic if already exists', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic);

      expect(result).toBeDefined();
      expect(result.expirationDate).toBeDefined();
      expect(result.allowUpdate).toEqual(false);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });

    it('TC0013 - should return qr code dynamic (Due Date) if already exists', async () => {
      const {
        sut,
        mockCreateQrCodeDynamicDueDateRepository,
        mockGetQrCodeDynamicByIdRepository,
        mockGetUserByUuidService,
        mockGetOnboardingService,
        mockGetAddressByIdService,
        mockGetpixKeyByKeyService,
        mockPendingEventEmitter,
      } = makeSut();

      const qrCodeDynamic =
        await QrCodeDynamicFactory.create<QrCodeDynamicEntity>(
          QrCodeDynamicEntity.name,
        );

      mockGetQrCodeDynamicByIdRepository.mockResolvedValueOnce(qrCodeDynamic);

      const result = await sut.execute(qrCodeDynamic);

      expect(result).toBeDefined();
      expect(result.expirationDate).toBeDefined();
      expect(result.allowUpdate).toEqual(false);

      expect(mockGetQrCodeDynamicByIdRepository).toHaveBeenCalledTimes(1);
      expect(mockCreateQrCodeDynamicDueDateRepository).toHaveBeenCalledTimes(0);
      expect(mockGetUserByUuidService).toHaveBeenCalledTimes(0);
      expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
      expect(mockGetAddressByIdService).toHaveBeenCalledTimes(0);
      expect(mockGetpixKeyByKeyService).toHaveBeenCalledTimes(0);
      expect(mockPendingEventEmitter).toHaveBeenCalledTimes(0);
    });
  });
});
