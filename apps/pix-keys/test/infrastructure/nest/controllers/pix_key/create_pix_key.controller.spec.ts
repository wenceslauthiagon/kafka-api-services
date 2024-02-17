import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf } from 'cpf-cnpj-validator';
import {
  defaultLogger as logger,
  InvalidDataFormatException,
} from '@zro/common';
import { OnboardingEntity, PersonType, UserEntity } from '@zro/users/domain';
import { KeyState, KeyType, PixKeyRepository } from '@zro/pix-keys/domain';
import {
  InvalidEmailFormatException,
  InvalidPhoneNumberFormatException,
  MaxNumberOfPixKeysReachedException,
  PixKeyUnsupportedCnpjTypeException,
} from '@zro/pix-keys/application';
import {
  CreatePixKeyMicroserviceController as Controller,
  PixKeyDatabaseRepository,
  PixKeyEventKafkaEmitter,
  UserServiceKafka,
  PixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  CreatePixKeyRequest,
  PixKeyEventEmitterControllerInterface,
  PixKeyEventType,
} from '@zro/pix-keys/interface';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('CreatePixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;

  const userService: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserService: jest.Mock = On(userService).get(
    method((mock) => mock.getUserByUuid),
  );
  const mockGetOnboardingService: jest.Mock = On(userService).get(
    method((mock) => mock.getOnboardingByUserAndStatusIsFinished),
  );

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const mockEmitPixKeyEvent: jest.Mock = On(pixKeyEventService).get(
    method((mock) => mock.emitPixKeyEvent),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PixKeyEventKafkaEmitter)
      .useValue(pixKeyEventService)
      .compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('CreatePixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create pix key EVP successfully', async () => {
        const id = faker.datatype.uuid();
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.NATURAL_PERSON,
          uuid: faker.datatype.uuid(),
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        mockGetUserService.mockResolvedValueOnce(user);
        mockGetOnboardingService.mockResolvedValueOnce(onboarding);

        const message: CreatePixKeyRequest = {
          id,
          userId: user.uuid,
          type: KeyType.EVP,
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyEventService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.key).toBeNull();
        expect(result.value.type).toBe(KeyType.EVP);
        expect(result.value.state).toBe(KeyState.CONFIRMED);
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetUserService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.CONFIRMED,
        );
      });

      it('TC0002 - Should return the created pix key successfully', async () => {
        const { userId, id, key, type, state, createdAt } =
          await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);

        const message: CreatePixKeyRequest = {
          userId,
          id,
          type,
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyEventService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toMatchObject({
          id,
          key,
          type,
          state,
          createdAt,
        });
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should create PHONE with space successfully', async () => {
        const id = faker.datatype.uuid();
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.NATURAL_PERSON,
          uuid: faker.datatype.uuid(),
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        mockGetUserService.mockResolvedValueOnce(user);
        mockGetOnboardingService.mockResolvedValueOnce(onboarding);

        const message: CreatePixKeyRequest = {
          id,
          userId: user.uuid,
          type: KeyType.PHONE,
          key: '+ 55 81 12345 6789',
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyEventService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.key).toBe('+5581123456789');
        expect(result.value.type).toBe(KeyType.PHONE);
        expect(result.value.state).toBe(KeyState.PENDING);
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetUserService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PENDING,
        );
      });

      it('TC0004 - Should create PHONE without plus sign successfully', async () => {
        const id = faker.datatype.uuid();
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.NATURAL_PERSON,
          uuid: faker.datatype.uuid(),
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        mockGetUserService.mockResolvedValueOnce(user);
        mockGetOnboardingService.mockResolvedValueOnce(onboarding);

        const message: CreatePixKeyRequest = {
          id,
          userId: user.uuid,
          type: KeyType.PHONE,
          key: '1281123456789',
        };

        const result = await controller.execute(
          pixKeyRepository,
          pixKeyEventService,
          userService,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(result.value.id).toBeDefined();
        expect(result.value.key).toBe(`+${message.key}`);
        expect(result.value.type).toBe(KeyType.PHONE);
        expect(result.value.state).toBe(KeyState.PENDING);
        expect(result.value.createdAt).toBeDefined();
        expect(mockGetUserService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent.mock.calls[0][0]).toBe(
          PixKeyEventType.PENDING,
        );
      });
    });

    describe('With invalid parameters', () => {
      it('TC0005 - Should not create pix key without phone', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.PHONE,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0006 - Should not create pix key with invalid phone', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.PHONE,
          key: 'x',
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          InvalidPhoneNumberFormatException,
        );
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0007 - Should not create pix key without email', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.EMAIL,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidDataFormatException);
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0008 - Should not create pix key with invalid email', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.EMAIL,
          key: 'x',
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(InvalidEmailFormatException);
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0009 - Should not create pix key with type cnpj', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.CNPJ,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          PixKeyUnsupportedCnpjTypeException,
        );
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0010 - Should not create pix key with invalid length phone (more than)', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.PHONE,
          key: '+5581912345678901234',
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          InvalidPhoneNumberFormatException,
        );
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0011 - Should not create pix key with invalid length phone (less than)', async () => {
        const id = faker.datatype.uuid();
        const userId = faker.datatype.uuid();
        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.PHONE,
          key: '+55819',
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          InvalidPhoneNumberFormatException,
        );
        expect(mockGetUserService).toHaveBeenCalledTimes(0);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(0);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0011 - Should not create pix key if user is natural person and max number of keys has been reached)', async () => {
        const id = faker.datatype.uuid();
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.NATURAL_PERSON,
          uuid: faker.datatype.uuid(),
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        mockGetUserService.mockResolvedValueOnce(user);
        mockGetOnboardingService.mockResolvedValueOnce(onboarding);

        const userId = user.uuid;

        await PixKeyFactory.createMany<PixKeyModel>(
          PixKeyModel.name,
          faker.datatype.number({ min: 5, max: 10 }),
          {
            userId: userId,
          },
        );

        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.EVP,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          MaxNumberOfPixKeysReachedException,
        );
        expect(mockGetUserService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });

      it('TC0012 - Should not create pix key if user is legal person and max number of keys has been reached)', async () => {
        const id = faker.datatype.uuid();
        const user = new UserEntity({
          id: faker.datatype.number({ min: 1, max: 99999 }),
          type: PersonType.LEGAL_PERSON,
          uuid: faker.datatype.uuid(),
          document: cpf.generate(),
          fullName: faker.name.fullName(),
        });
        const onboarding = new OnboardingEntity({
          fullName: faker.name.fullName(),
          accountNumber: faker.datatype
            .number(99999999)
            .toString()
            .padStart(8, '0'),
          branch: faker.datatype.number(9999).toString().padStart(4, '0'),
          updatedAt: faker.date.recent(9999),
        });
        mockGetUserService.mockResolvedValueOnce(user);
        mockGetOnboardingService.mockResolvedValueOnce(onboarding);

        const userId = user.uuid;

        await PixKeyFactory.createMany<PixKeyModel>(
          PixKeyModel.name,
          faker.datatype.number({ min: 20, max: 25 }),
          {
            userId: userId,
          },
        );

        const message: CreatePixKeyRequest = {
          id,
          userId,
          type: KeyType.EVP,
        };

        const testScript = () =>
          controller.execute(
            pixKeyRepository,
            pixKeyEventService,
            userService,
            logger,
            message,
            ctx,
          );

        await expect(testScript).rejects.toThrow(
          MaxNumberOfPixKeysReachedException,
        );
        expect(mockGetUserService).toHaveBeenCalledTimes(1);
        expect(mockGetOnboardingService).toHaveBeenCalledTimes(1);
        expect(mockEmitPixKeyEvent).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
