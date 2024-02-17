import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, MissingDataException } from '@zro/common';
import { DecodedPixKeyRepository } from '@zro/pix-keys/domain';
import { GetByIdDecodedPixKeyUseCase as UseCase } from '@zro/pix-keys/application';
import {
  DecodedPixKeyDatabaseRepository,
  DecodedPixKeyModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';

describe('GetByIdDecodedPixKeyUseCase', () => {
  let module: TestingModule;
  let decodedPixKeyRepository: DecodedPixKeyRepository;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    decodedPixKeyRepository = new DecodedPixKeyDatabaseRepository();
  });

  describe('With invalid parameters', () => {
    it('TC0001 - Should get decoded pix key successfully', async () => {
      const decodedPixKey =
        await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
          DecodedPixKeyModel.name,
        );

      const usecase = new UseCase(logger, decodedPixKeyRepository);

      const result = await usecase.execute(decodedPixKey.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(decodedPixKey.id);
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - Should not get decoded pix key without id', async () => {
      const usecase = new UseCase(logger, decodedPixKeyRepository);

      const testScript = () => usecase.execute(null);

      await expect(testScript).rejects.toThrow(MissingDataException);
    });

    it('TC0003 - Should not get decoded pix key when id not exists', async () => {
      const usecase = new UseCase(logger, decodedPixKeyRepository);

      const result = await usecase.execute(uuidV4());

      await expect(result).toBeNull();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
