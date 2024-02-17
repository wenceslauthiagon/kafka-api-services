import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { PixKeyEntity, KeyState } from '@zro/pix-keys/domain';
import {
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import { AddressEntity, OnboardingEntity, UserEntity } from '@zro/users/domain';
import { AddressNotFoundException } from '@zro/users/application';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  CreateQrCodeDynamicInstantBillingMicroserviceController as Controller,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicModel,
  UserServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CreateQrCodeDynamicInstantBillingRequest,
  QrCodeDynamicEventEmitterControllerInterface,
  QrCodeDynamicEventType,
} from '@zro/pix-payments/interface';
import { QrCodeDynamicFactory } from '@zro/test/pix-payments/config';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import {
  AddressFactory,
  OnboardingFactory,
  UserFactory,
} from '@zro/test/users/config';

describe('CreateQrCodeDynamicMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeDynamicRepository: QrCodeDynamicRepository;

  const eventEmitter: QrCodeDynamicEventEmitterControllerInterface =
    createMock<QrCodeDynamicEventEmitterControllerInterface>();
  const mockEmitQrCodeDynamicEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeDynamicEvent),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );

  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );

  const mockGetAddressService: jest.Mock = On(userService).get(
    method((mock) => mock.getAddressById),
  );

  const pixKeyService: PixKeyServiceKafka = createMock<PixKeyServiceKafka>();
  const mockGetPixKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.getPixKeyByKeyAndUser),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeDynamicRepository = new QrCodeDynamicDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateQrCodeDynamic', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create qrCodeDynamic successfully', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.READY, user },
        );

        const address = await AddressFactory.create<AddressEntity>(
          AddressEntity.name,
        );

        const onboarding = await OnboardingFactory.create<OnboardingEntity>(
          OnboardingEntity.name,
          { address },
        );

        mockGetPixKeyService.mockResolvedValue(pixKey);
        mockGetAddressService.mockResolvedValue(address);
        mockGetOnboardingService.mockResolvedValue(onboarding);
        mockGetUserByUuidService.mockResolvedValue(user);

        const message: CreateQrCodeDynamicInstantBillingRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          expirationDate: faker.date.recent(99),
          allowUpdate: faker.datatype.boolean(),
          description: faker.datatype.string(),
        };
        const result = await controller.execute(
          qrCodeDynamicRepository,
          eventEmitter,
          userService,
          pixKeyService,
          logger,
          message,
          ctx,
        );
        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.summary).not.toBeDefined();
        expect(result.value.keyId).toBe(pixKey.id);
        expect(result.value.documentValue).toBeDefined();
        expect(result.value.state).toBe(PixQrCodeDynamicState.PENDING);
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetPixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockGetAddressService).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeDynamicEvent.mock.calls[0][0]).toBe(
          QrCodeDynamicEventType.PENDING,
        );
      });

      it('TC0002 - should get the created qrCodeDynamic', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.READY, user },
        );

        const qrCodeDynamic =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { userId: user.uuid },
          );

        mockGetOnboardingService;

        const message: CreateQrCodeDynamicInstantBillingRequest = {
          id: qrCodeDynamic.id,
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          expirationDate: faker.date.recent(99),
          allowUpdate: faker.datatype.boolean(),
          description: faker.datatype.string(),
        };

        const result = await controller.execute(
          qrCodeDynamicRepository,
          eventEmitter,
          userService,
          pixKeyService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBe(qrCodeDynamic.id);
        expect(result.value.summary).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.documentValue).toBeDefined();
        expect(result.value.keyId).toBe(qrCodeDynamic.keyId);
        expect(result.value.state).toBe(qrCodeDynamic.state);
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetPixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0003 - Should not create the qrCodeDynamic if another user has this qrCodeDynamic id', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.READY },
        );

        const qrCodeDynamic =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { userId: faker.datatype.uuid() },
          );

        const message: CreateQrCodeDynamicInstantBillingRequest = {
          id: qrCodeDynamic.id,
          userId: faker.datatype.uuid(),
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          expirationDate: faker.date.recent(99),
          allowUpdate: faker.datatype.boolean(),
          description: faker.datatype.string(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(ForbiddenException);
        expect(mockGetPixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not create if pixKey is not found', async () => {
        const pixKey = new PixKeyEntity({ key: faker.datatype.string(70) });

        mockGetPixKeyService.mockResolvedValue(null);

        const message: CreateQrCodeDynamicInstantBillingRequest = {
          id: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          expirationDate: faker.date.recent(99),
          allowUpdate: faker.datatype.boolean(),
          description: faker.datatype.string(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
        expect(mockGetPixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not create if pixKey is not ready state', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.DELETED },
        );

        const user = pixKey.user;

        mockGetPixKeyService.mockResolvedValue(pixKey);

        const message: CreateQrCodeDynamicInstantBillingRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          expirationDate: faker.date.recent(99),
          allowUpdate: faker.datatype.boolean(),
          description: faker.datatype.string(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
        expect(mockGetPixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not create if address is not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.READY, user },
        );

        const onboarding = new OnboardingEntity({ id: faker.datatype.uuid() });

        mockGetPixKeyService.mockResolvedValue(pixKey);
        mockGetUserByUuidService.mockResolvedValue(user);
        mockGetOnboardingService.mockResolvedValue(onboarding);

        const message: CreateQrCodeDynamicInstantBillingRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          expirationDate: faker.date.recent(99),
          allowUpdate: faker.datatype.boolean(),
          description: faker.datatype.string(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(AddressNotFoundException);
        expect(mockGetPixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeDynamicEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
