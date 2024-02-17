import { createMock } from 'ts-auto-mock';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  DecodedPixKeyState,
  DecodedPixKeyRepository,
  DecodedPixKeyEntity,
  KeyType,
} from '@zro/pix-keys/domain';
import { PersonType, UserEntity } from '@zro/users/domain';
import {
  ErrorDecodedPixKeyNestObserver as Observer,
  DecodedPixKeyDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { HandleErrorDecodedPixKeyEventRequest } from '@zro/pix-keys/interface';
import { UserFactory } from '@zro/test/users/config';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';

describe('ErrorDecodedPixKeyNestObserver', () => {
  let module: TestingModule;
  let controller: Observer;
  let decodedPixKeyRepository: DecodedPixKeyRepository;

  const kafkaService: KafkaService = createMock<KafkaService>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Observer>(Observer);
    decodedPixKeyRepository = new DecodedPixKeyDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should handle error decoded pix key event successfully', async () => {
      const state = DecodedPixKeyState.ERROR;

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const id = faker.datatype.uuid();
      const key = faker.datatype.uuid();

      const message: HandleErrorDecodedPixKeyEventRequest = {
        id,
        state,
        userId: user.uuid,
        key,
        type: KeyType.EVP,
        personType: PersonType.NATURAL_PERSON,
      };

      await controller.execute(message, decodedPixKeyRepository, logger);

      const decoded = await decodedPixKeyRepository.getById(id);
      expect(decoded.id).toBe(id);
      expect(decoded.state).toBe(state);
      expect(decoded.key).toBe(key);
      expect(decoded.user.uuid).toBe(user.uuid);
    });

    it('TC0002 - Should idempotency handle error decoded pix key event successfully', async () => {
      const state = DecodedPixKeyState.ERROR;

      const user = await UserFactory.create<UserEntity>(UserEntity.name);

      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyEntity>(
          DecodedPixKeyEntity.name,
          { user },
        );

      const message: HandleErrorDecodedPixKeyEventRequest = {
        id: decodedPixKey.id,
        state,
        userId: user.uuid,
        key: decodedPixKey.key,
        type: decodedPixKey.type,
        personType: decodedPixKey.personType,
      };

      await controller.execute(message, decodedPixKeyRepository, logger);

      const decoded = await decodedPixKeyRepository.getById(decodedPixKey.id);
      expect(decoded.id).toBe(decodedPixKey.id);
      expect(decoded.state).toBe(state);
      expect(decoded.key).toBe(decodedPixKey.key);
      expect(decoded.user.uuid).toBe(user.uuid);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
