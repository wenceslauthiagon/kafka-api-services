import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import {
  CurrencyModel,
  P2PTransferModel,
  WalletModel,
  OperationModel,
  TransactionTypeModel,
  WalletAccountModel,
} from '@zro/operations/infrastructure';
import { P2PTransferFactory } from '@zro/test/operations/config';

describe('P2PTransferModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([
          CurrencyModel,
          WalletModel,
          OperationModel,
          WalletAccountModel,
          TransactionTypeModel,
          P2PTransferModel,
        ]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', async () => {
    const p2pTransfer = await P2PTransferFactory.create<P2PTransferModel>(
      P2PTransferModel.name,
    );
    expect(p2pTransfer).toBeDefined();
    expect(p2pTransfer.id).toBeDefined();
    expect(p2pTransfer.operationId).toBeDefined();
    expect(p2pTransfer.currencyId).toBeDefined();
    expect(p2pTransfer.walletId).toBeDefined();
    expect(p2pTransfer.userId).toBeDefined();
    expect(p2pTransfer.beneficiaryWalletId).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
