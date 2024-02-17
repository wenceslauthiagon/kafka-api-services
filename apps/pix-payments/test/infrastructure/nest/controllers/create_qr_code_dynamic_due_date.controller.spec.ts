import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { defaultLogger as logger, ForbiddenException } from '@zro/common';
import { cpf } from 'cpf-cnpj-validator';
import {
  PixKeyInvalidStateException,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  AddressEntity,
  OnboardingEntity,
  PersonType,
  UserEntity,
} from '@zro/users/domain';
import { AddressNotFoundException } from '@zro/users/application';
import { PixKeyEntity, KeyState } from '@zro/pix-keys/domain';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import {
  QrCodeDynamicRepository,
  PixQrCodeDynamicState,
} from '@zro/pix-payments/domain';
import {
  CreateQrCodeDynamicDueDateMicroserviceController as Controller,
  QrCodeDynamicDatabaseRepository,
  QrCodeDynamicModel,
  UserServiceKafka,
  PixKeyServiceKafka,
} from '@zro/pix-payments/infrastructure';
import {
  CreateQrCodeDynamicDueDateRequest,
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

describe('CreateQrCodeDynamicDueDateMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let qrCodeDynamicDueDateRepository: QrCodeDynamicRepository;

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
    qrCodeDynamicDueDateRepository = new QrCodeDynamicDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreateQrCodeDynamic', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create qrCodeDynamic (Due Date) successfully', async () => {
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

        const message: CreateQrCodeDynamicDueDateRequest = {
          payerPersonType: PersonType.NATURAL_PERSON,
          id: faker.datatype.uuid(),
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          payerName: faker.name.fullName(),
          payerAddress: faker.address.streetAddress(),
          payerDocument: cpf.generate(),
          summary: faker.datatype.string(),
          dueDate: faker.datatype.datetime(),
          description: faker.datatype.string(),
          expirationDate: faker.date.recent(99),
          allowUpdate: false,
          allowUpdateChange: false,
          allowUpdateWithdrawal: false,
          payerRequest: faker.name.fullName(),
        };
        const result = await controller.execute(
          qrCodeDynamicDueDateRepository,
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
        expect(result.value.summary).toBe(message.summary);
        expect(result.value.keyId).toBe(pixKey.id);
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
    });

    describe('With invalid parameters', () => {
      it('TC0002 - Should not create the qrCodeDynamic (Due Date) if another user has this qrCodeDynamic id', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.READY },
        );

        const qrCodeDynamic =
          await QrCodeDynamicFactory.create<QrCodeDynamicModel>(
            QrCodeDynamicModel.name,
            { userId: faker.datatype.uuid() },
          );

        const message: CreateQrCodeDynamicDueDateRequest = {
          payerPersonType: PersonType.NATURAL_PERSON,
          id: qrCodeDynamic.id,
          userId: faker.datatype.uuid(),
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          payerName: faker.name.fullName(),
          payerAddress: faker.address.streetAddress(),
          payerDocument: cpf.generate(),
          summary: faker.datatype.string(),
          dueDate: faker.datatype.datetime(),
          description: faker.datatype.string(),
          allowUpdate: false,
          allowUpdateChange: false,
          allowUpdateWithdrawal: false,
          expirationDate: faker.date.recent(99),
          payerRequest: faker.name.fullName(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicDueDateRepository,
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

      it('TC0003 - Should not create if pixKey is not found', async () => {
        const pixKey = new PixKeyEntity({ key: faker.datatype.string(70) });

        mockGetPixKeyService.mockResolvedValue(null);

        const message: CreateQrCodeDynamicDueDateRequest = {
          payerPersonType: PersonType.NATURAL_PERSON,
          id: faker.datatype.uuid(),
          userId: faker.datatype.uuid(),
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          payerName: faker.name.fullName(),
          payerAddress: faker.address.streetAddress(),
          payerDocument: cpf.generate(),
          summary: faker.datatype.string(),
          dueDate: faker.datatype.datetime(),
          description: faker.datatype.string(),
          allowUpdate: false,
          allowUpdateChange: false,
          allowUpdateWithdrawal: false,
          expirationDate: faker.date.recent(99),
          payerRequest: faker.name.fullName(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicDueDateRepository,
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

      it('TC0004 - Should not create if pixKey is not ready state', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.DELETED },
        );

        const user = pixKey.user;

        mockGetPixKeyService.mockResolvedValue(pixKey);

        const message: CreateQrCodeDynamicDueDateRequest = {
          payerPersonType: PersonType.NATURAL_PERSON,
          id: faker.datatype.uuid(),
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          payerName: faker.name.fullName(),
          payerAddress: faker.address.streetAddress(),
          payerDocument: cpf.generate(),
          summary: faker.datatype.string(),
          dueDate: faker.datatype.datetime(),
          description: faker.datatype.string(),
          allowUpdate: false,
          allowUpdateChange: false,
          allowUpdateWithdrawal: false,
          expirationDate: faker.date.recent(99),
          payerRequest: faker.name.fullName(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicDueDateRepository,
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

      it('TC0005 - Should not create if address is not found', async () => {
        const user = await UserFactory.create<UserEntity>(UserEntity.name);

        const pixKey = await PixKeyFactory.create<PixKeyEntity>(
          PixKeyEntity.name,
          { state: KeyState.READY, user },
        );

        const onboarding = new OnboardingEntity({ id: faker.datatype.uuid() });

        mockGetPixKeyService.mockResolvedValue(pixKey);
        mockGetUserByUuidService.mockResolvedValue(user);
        mockGetOnboardingService.mockResolvedValue(onboarding);

        const message: CreateQrCodeDynamicDueDateRequest = {
          payerPersonType: PersonType.NATURAL_PERSON,
          id: faker.datatype.uuid(),
          userId: user.uuid,
          key: pixKey.key,
          documentValue: faker.datatype.number({ min: 1, max: 99999 }),
          description: faker.datatype.string(),
          payerName: faker.name.fullName(),
          payerAddress: faker.address.streetAddress(),
          payerDocument: cpf.generate(),
          summary: faker.datatype.string(),
          dueDate: faker.datatype.datetime(),
          allowUpdate: false,
          allowUpdateChange: false,
          allowUpdateWithdrawal: false,
          expirationDate: faker.date.recent(99),
          payerRequest: faker.name.fullName(),
        };

        const testScript = () =>
          controller.execute(
            qrCodeDynamicDueDateRepository,
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
