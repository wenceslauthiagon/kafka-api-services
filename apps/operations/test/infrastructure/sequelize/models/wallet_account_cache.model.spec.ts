import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  CurrencyModel,
  WalletAccountCacheModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { WalletAccountCacheFactory } from '@zro/test/operations/config';

describe('WalletAccountCacheModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          WalletModel,
          WalletAccountCacheModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const walletAccountCache =
      await WalletAccountCacheFactory.create<WalletAccountCacheModel>(
        WalletAccountCacheModel.name,
      );

    expect(walletAccountCache).toBeDefined();
    expect(walletAccountCache.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
