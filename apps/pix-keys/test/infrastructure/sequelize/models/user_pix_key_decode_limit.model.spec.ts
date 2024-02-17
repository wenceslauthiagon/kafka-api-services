import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  PixKeyModel,
  UserPixKeyDecodeLimitModel,
} from '@zro/pix-keys/infrastructure';
import { UserPixKeyDecodeLimitFactory } from '@zro/test/pix-keys/config';

describe('UserPixKeyDecodeLimitModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
        DatabaseModule.forFeature([UserPixKeyDecodeLimitModel, PixKeyModel]),
      ],
    }).compile();
  });

  it('TC0001 - module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - model should be defined', async () => {
    const decodedPixKey =
      await UserPixKeyDecodeLimitFactory.create<UserPixKeyDecodeLimitModel>(
        UserPixKeyDecodeLimitModel.name,
      );

    expect(decodedPixKey.id).toBeDefined();
    expect(decodedPixKey.limit).toBeDefined();
    expect(decodedPixKey.userId).toBeDefined();
    expect(decodedPixKey.lastDecodedCreatedAt).toBeDefined();
    expect(decodedPixKey.createdAt).toBeDefined();
    expect(decodedPixKey.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
