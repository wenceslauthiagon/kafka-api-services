import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { PixKeyHistoryModel, PixKeyModel } from '@zro/pix-keys/infrastructure';
import { PixKeyHistoryFactory } from '@zro/test/pix-keys/config';

describe('PixKeyHistoryModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
        DatabaseModule.forFeature([PixKeyHistoryModel, PixKeyModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const pixKeyHistory = await PixKeyHistoryFactory.create<PixKeyHistoryModel>(
      PixKeyHistoryModel.name,
    );
    expect(pixKeyHistory).toBeDefined();
    expect(pixKeyHistory.id).toBeDefined();
    expect(pixKeyHistory.state).toBeDefined();
    expect(pixKeyHistory.pixKeyId).toBeDefined();
    expect(pixKeyHistory.createdAt).toBeDefined();
    expect(pixKeyHistory.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
