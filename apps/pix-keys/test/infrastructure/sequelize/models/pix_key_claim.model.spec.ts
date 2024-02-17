import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { PixKeyClaimModel, PixKeyModel } from '@zro/pix-keys/infrastructure';
import { PixKeyClaimFactory } from '@zro/test/pix-keys/config';

describe('PixKeyClaimModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
        DatabaseModule.forFeature([PixKeyClaimModel, PixKeyModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
      PixKeyClaimModel.name,
    );
    expect(pixKeyClaim).toBeDefined();
    expect(pixKeyClaim.id).toBeDefined();
    expect(pixKeyClaim.keyType).toBeDefined();
    expect(pixKeyClaim.key).toBeDefined();
    expect(pixKeyClaim.type).toBeDefined();
    expect(pixKeyClaim.status).toBeDefined();
    expect(pixKeyClaim.ispb).toBeDefined();
    expect(pixKeyClaim.document).toBeDefined();
    expect(pixKeyClaim.branch).toBeDefined();
    expect(pixKeyClaim.accountNumber).toBeDefined();
    expect(pixKeyClaim.personType).toBeDefined();
    expect(pixKeyClaim.createdAt).toBeDefined();
    expect(pixKeyClaim.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
