import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  ForbiddenException,
  InvalidDataFormatException,
  MissingDataException,
} from '@zro/common';
import { UserEntity, AddressEntity, OnboardingEntity } from '@zro/users/domain';
import { PixKeyEntity, KeyType, KeyState } from '@zro/pix-keys/domain';
import {
  QrCodeStaticRepository,
  QrCodeStaticState,
} from '@zro/pix-payments/domain';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import { AddressNotFoundException } from '@zro/users/application';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  CreateQrCodeStaticMicroserviceController as Controller,
  QrCodeStaticDatabaseRepository,
  QrCodeStaticModel,
  UserServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeStaticRequest,
  QrCodeStaticEventEmitterControllerInterface,
  QrCodeStaticEventType,
} from '@zro/pix-payments/interface';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';

describe('CreateQrCodeStaticMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeStaticRepository: QrCodeStaticRepository;

  const eventEmitter: QrCodeStaticEventEmitterControllerInterface =
    createMock<QrCodeStaticEventEmitterControllerInterface>();
  const mockEmitQrCodeStaticEvent: jest.Mock = On(eventEmitter).get(
    method((mock) => mock.emitQrCodeStaticEvent),
  );

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );
  const mockGetAddressService: jest.Mock = On(userService).get(
    method((mock) => mock.getAddressById),
  );

  const pixKeyService: PixKeyServiceKafka = createMock<PixKeyServiceKafka>();
  const mockGetpixKeyService: jest.Mock = On(pixKeyService).get(
    method((mock) => mock.getPixKeyByIdAndUser),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    qrCodeStaticRepository = new QrCodeStaticDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateQrCodeStatic', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create qrCodeStatic successfully', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const pixKey = new PixKeyEntity({
          id: faker.datatype.uuid(),
          key: faker.datatype.uuid(),
          type: KeyType.EVP,
          state: KeyState.READY,
          user,
        });
        const address = new AddressEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          city: faker.address.cityName(),
        });
        const onboarding = new OnboardingEntity({
          id: faker.datatype.uuid(),
          address,
          fullName: faker.name.fullName(),
        });
        mockGetpixKeyService.mockResolvedValue(pixKey);
        mockGetAddressService.mockResolvedValue(address);
        mockGetOnboardingService.mockResolvedValue(onboarding);

        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          keyId: pixKey.id,
        };

        const result = await controller.execute(
          qrCodeStaticRepository,
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
        expect(result.value.emv).toBeUndefined();
        expect(result.value.txId).toBeDefined();
        expect(result.value.summary).toBeUndefined();
        expect(result.value.description).toBeUndefined();
        expect(result.value.keyId).toBe(pixKey.id);
        expect(result.value.documentValue).toBeUndefined();
        expect(result.value.state).toBe(QrCodeStaticState.PENDING);
        expect(result.value.ispbWithdrawal).toBeUndefined();
        expect(result.value.expirationDate).toBeUndefined();
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockGetAddressService).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitQrCodeStaticEvent.mock.calls[0][0]).toBe(
          QrCodeStaticEventType.PENDING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should get the created qrCodeStatic', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
          );
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: qrCodeStatic.userId,
        });
        const pixKey = new PixKeyEntity({ id: qrCodeStatic.keyId, user });

        const message: CreateQrCodeStaticRequest = {
          id: qrCodeStatic.id,
          userId: user.uuid,
          keyId: pixKey.id,
          ispbWithdrawal: faker.datatype.uuid(),
          expirationDate: faker.date.future(),
        };

        const result = await controller.execute(
          qrCodeStaticRepository,
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
        expect(result.value.id).toBe(qrCodeStatic.id);
        expect(result.value.emv).toBeDefined();
        expect(result.value.txId).toBeDefined();
        expect(result.value.summary).toBeDefined();
        expect(result.value.description).toBeDefined();
        expect(result.value.documentValue).toBeDefined();
        expect(result.value.ispbWithdrawal).toBeDefined();
        expect(result.value.expirationDate).toBeDefined();
        expect(result.value.keyId).toBe(qrCodeStatic.keyId);
        expect(result.value.state).toBe(qrCodeStatic.state);
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not create the qrCodeStatic if another user has this qrCodeStatic id', async () => {
        const qrCodeStatic =
          await QrCodeStaticFactory.create<QrCodeStaticModel>(
            QrCodeStaticModel.name,
          );
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const pixKey = new PixKeyEntity({ id: faker.datatype.uuid(), user });

        const message: CreateQrCodeStaticRequest = {
          id: qrCodeStatic.id,
          userId: user.uuid,
          keyId: pixKey.id,
          ispbWithdrawal: faker.random.alphaNumeric(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(ForbiddenException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0004 - Should not create if pixKey is not found', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const pixKey = new PixKeyEntity({ id: faker.datatype.uuid(), user });

        mockGetpixKeyService.mockResolvedValue(null);

        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          keyId: pixKey.id,
          ispbWithdrawal: faker.random.alphaNumeric(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0005 - Should not create if pixKey is not ready state', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const pixKey = new PixKeyEntity({
          id: faker.datatype.uuid(),
          state: KeyState.CONFIRMED,
          user,
        });

        mockGetpixKeyService.mockResolvedValue(pixKey);

        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          keyId: pixKey.id,
          ispbWithdrawal: faker.random.alphaNumeric(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(PixKeyInvalidStateException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not create if address is not found', async () => {
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          uuid: faker.datatype.uuid(),
        });
        const pixKey = new PixKeyEntity({
          id: faker.datatype.uuid(),
          state: KeyState.READY,
          user,
        });
        const onboarding = new OnboardingEntity({
          id: faker.datatype.uuid(),
          fullName: faker.datatype.uuid(),
        });

        mockGetpixKeyService.mockResolvedValue(pixKey);
        mockGetOnboardingService.mockResolvedValue(onboarding);

        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: user.uuid,
          keyId: pixKey.id,
          ispbWithdrawal: faker.random.alphaNumeric(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(AddressNotFoundException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not create if pix key param is missing', async () => {
        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should not create if payableManyTimes is not boolean', async () => {
        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          keyId: faker.datatype.uuid(),
          payableManyTimes: 'x' as any,
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should not create if payableManyTimes is true without expirationDate', async () => {
        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          key: faker.datatype.uuid(),
          payableManyTimes: false,
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(MissingDataException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should not create if expirationDate in past', async () => {
        const message: CreateQrCodeStaticRequest = {
          id: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          key: faker.datatype.uuid(),
          expirationDate: faker.date.past(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeStaticRepository,
            eventEmitter,
            userService,
            pixKeyService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetpixKeyService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockGetAddressService).toHaveBeenCalledTimes(0);
        expect(mockEmitQrCodeStaticEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
