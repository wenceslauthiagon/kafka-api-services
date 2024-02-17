import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { DecodedPixKeyModel } from '@zro/pix-keys/infrastructure';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';

describe('DecodedPixKeyModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-keys.env'] }),
        DatabaseModule.forFeature([DecodedPixKeyModel]),
      ],
    }).compile();
  });

  it('TC0001 - module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - model should be defined', async () => {
    const decodedPixKey = await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
      DecodedPixKeyModel.name,
    );

    expect(decodedPixKey.id).toBeDefined();
    expect(decodedPixKey.type).toBeDefined();
    expect(decodedPixKey.key).toBeDefined();
    expect(decodedPixKey.personType).toBeDefined();
    expect(decodedPixKey.document).toBeDefined();
    expect(decodedPixKey.name).toBeDefined();
    expect(decodedPixKey.tradeName).toBeDefined();
    expect(decodedPixKey.accountNumber).toBeDefined();
    expect(decodedPixKey.accountType).toBeDefined();
    expect(decodedPixKey.branch).toBeDefined();
    expect(decodedPixKey.ispb).toBeDefined();
    expect(decodedPixKey.activeAccount).toBeDefined();
    expect(decodedPixKey.accountOpeningDate).toBeDefined();
    expect(decodedPixKey.keyCreationDate).toBeDefined();
    expect(decodedPixKey.keyOwnershipDate).toBeDefined();
    expect(decodedPixKey.claimRequestDate).toBeDefined();
    expect(decodedPixKey.endToEndId).toBeDefined();
    expect(decodedPixKey.cidId).toBeDefined();
    expect(decodedPixKey.dictAccountId).toBeDefined();
    expect(decodedPixKey.state).toBeDefined();
    expect(decodedPixKey.createdAt).toBeDefined();
    expect(decodedPixKey.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
