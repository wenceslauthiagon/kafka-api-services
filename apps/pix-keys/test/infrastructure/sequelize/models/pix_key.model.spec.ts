import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { PixKeyModel } from '@zro/pix-keys/infrastructure';
import { PixKeyFactory } from '@zro/test/pix-keys/config';

describe('PixKeyModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
        DatabaseModule.forFeature([PixKeyModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name);
    expect(pixKey).toBeDefined();
    expect(pixKey.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
