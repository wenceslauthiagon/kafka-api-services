import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { CardModel } from '@zro/banking/infrastructure';
import { CardFactory } from '@zro/test/banking/config';

describe('CardModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.banking.env'] }),
        DatabaseModule.forFeature([CardModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const card = await CardFactory.create<CardModel>(CardModel.name);
    expect(card).toBeDefined();
    expect(card.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
