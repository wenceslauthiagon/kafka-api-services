import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  PixKeyModel,
  PixKeyVerificationModel,
} from '@zro/pix-keys/infrastructure';
import { PixKeyVerificationFactory } from '@zro/test/pix-keys/config';

describe('PixKeyVerificationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
        DatabaseModule.forFeature([PixKeyVerificationModel, PixKeyModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const pixKeyVerification =
      await PixKeyVerificationFactory.create<PixKeyVerificationModel>(
        PixKeyVerificationModel.name,
      );
    expect(pixKeyVerification).toBeDefined();
    expect(pixKeyVerification.id).toBeDefined();
    expect(pixKeyVerification.code).toBeDefined();
    expect(pixKeyVerification.pixKeyId).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
