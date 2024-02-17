import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaContext } from '@nestjs/microservices';
import {
  defaultLogger as logger,
  ForbiddenException,
  RedisKey,
  RedisService,
} from '@zro/common';
import { PersonType, UserEntity } from '@zro/users/domain';
import {
  DecodedPixKeyRepository,
  DecodedPixKeyState,
  KeyState,
  KeyType,
  PixKeyRepository,
  UserPixKeyDecodeLimitRepository,
} from '@zro/pix-keys/domain';
import { DecodedPixKeyPspGateway } from '@zro/pix-keys/application';
import { UserNotFoundException } from '@zro/users/application';
import {
  CreateDecodedPixKeyMicroserviceController as Controller,
  UserServiceKafka,
  DecodedPixKeyDatabaseRepository,
  PixKeyDatabaseRepository,
  UserPixKeyDecodeLimitDatabaseRepository,
  PixKeyDecodeLimitModel,
  PixKeyModel,
  DecodedPixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import {
  CreateDecodedPixKeyRequest,
  DecodedPixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  DecodedPixKeyFactory,
  PixKeyFactory,
  PixKeyDecodeLimitFactory,
} from '@zro/test/pix-keys/config';

describe('DecodedPixKeyMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let decodedPixKeyRepository: DecodedPixKeyRepository;
  let pixKeyRepository: PixKeyRepository;
  let userPixKeyDecodeLimitRepository: UserPixKeyDecodeLimitRepository;

  const userServiceKafka: UserServiceKafka = createMock<UserServiceKafka>();
  const mockGetUserByUuidService: jest.Mock = On(userServiceKafka).get(
    method((mock) => mock.getUserByUuid),
  );

  const decodedPixKeyGateway: DecodedPixKeyPspGateway =
    createMock<DecodedPixKeyPspGateway>();

  const mockDecodedPixKeyEventEmitter: DecodedPixKeyEventEmitterControllerInterface =
    createMock<DecodedPixKeyEventEmitterControllerInterface>();
  const mockCreatedDecodedPixKeyEventEmitter: jest.Mock = On(
    mockDecodedPixKeyEventEmitter,
  ).get(method((mock) => mock.emitDecodedPixKeyEvent));

  const redisService: RedisService = createMock<RedisService>();
  const mockGetRedisService: jest.Mock = On(redisService).get(
    method((mock) => mock.get),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RedisService)
      .useValue(redisService)
      .compile();
    controller = module.get<Controller>(Controller);

    await PixKeyDecodeLimitFactory.create<PixKeyDecodeLimitModel>(
      PixKeyDecodeLimitModel.name,
      {
        personType: PersonType.NATURAL_PERSON,
        limit: 100,
      },
    );

    await PixKeyDecodeLimitFactory.create<PixKeyDecodeLimitModel>(
      PixKeyDecodeLimitModel.name,
      {
        personType: PersonType.LEGAL_PERSON,
        limit: 1000,
      },
    );

    decodedPixKeyRepository = new DecodedPixKeyDatabaseRepository();
    pixKeyRepository = new PixKeyDatabaseRepository();
    userPixKeyDecodeLimitRepository =
      new UserPixKeyDecodeLimitDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('DecodedPixKey', () => {
    describe('With valid parameters', () => {
      it('TC0001 - Should create decodedPixKey successfully', async () => {
        const pixKey = await PixKeyFactory.create<PixKeyModel>(
          PixKeyModel.name,
          { type: KeyType.EVP, state: KeyState.READY },
        );
        const user = new UserEntity({
          uuid: pixKey.userId,
          active: true,
          document: '00000000000',
          type: PersonType.NATURAL_PERSON,
        });
        await DecodedPixKeyFactory.createMany<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
          3,
          {
            userId: user.uuid,
            state: DecodedPixKeyState.PENDING,
            createdAt: new Date(),
          },
        );

        const key: RedisKey = { key: user.uuid, data: null, ttl: 1 };
        mockGetRedisService.mockResolvedValue(key);
        mockGetUserByUuidService.mockResolvedValue(user);

        const message: CreateDecodedPixKeyRequest = {
          id: uuidV4(),
          userId: user.uuid,
          key: uuidV4(),
          type: KeyType.EVP,
        };

        const result = await controller.execute(
          decodedPixKeyGateway,
          decodedPixKeyRepository,
          pixKeyRepository,
          userPixKeyDecodeLimitRepository,
          mockDecodedPixKeyEventEmitter,
          logger,
          message,
          userServiceKafka,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.ctx).toBeDefined();
        expect(result.value).toBeDefined();
        expect(mockCreatedDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(1);
      });
    });

    describe('With invalid parameters', () => {
      it('TC0002 - should not get the created decodedPixKey if user is not found', async () => {
        const userId = uuidV4();

        const message: CreateDecodedPixKeyRequest = {
          id: uuidV4(),
          userId,
          key: uuidV4(),
          type: KeyType.EVP,
        };

        const testScript = () =>
          controller.execute(
            decodedPixKeyGateway,
            decodedPixKeyRepository,
            pixKeyRepository,
            userPixKeyDecodeLimitRepository,
            mockDecodedPixKeyEventEmitter,
            logger,
            message,
            userServiceKafka,
            ctx,
          );

        await expect(testScript).rejects.toThrow(UserNotFoundException);
        expect(mockCreatedDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      });

      it('TC0003 - Should not create the decodedPixKey if another user has this decodedPixKey id', async () => {
        const user = new UserEntity({ uuid: uuidV4() });

        const decodedPixKey =
          await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
            DecodedPixKeyModel.name,
            {
              type: KeyType.EVP,
              userId: user.uuid,
              state: DecodedPixKeyState.PENDING,
            },
          );

        const message: CreateDecodedPixKeyRequest = {
          id: decodedPixKey.id,
          userId: uuidV4(),
          key: uuidV4(),
          type: KeyType.EVP,
        };

        const testScript = () =>
          controller.execute(
            decodedPixKeyGateway,
            decodedPixKeyRepository,
            pixKeyRepository,
            userPixKeyDecodeLimitRepository,
            mockDecodedPixKeyEventEmitter,
            logger,
            message,
            userServiceKafka,
            ctx,
          );

        await expect(testScript).rejects.toThrow(ForbiddenException);
        expect(mockCreatedDecodedPixKeyEventEmitter).toHaveBeenCalledTimes(0);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
