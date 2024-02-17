import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyClaimModel } from '@zro/api-topazio/infrastructure';
import { NotifyClaimFactory } from '@zro/test/api-topazio/config';

describe('NotifyClaimModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyClaimModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyClaim = await NotifyClaimFactory.create<NotifyClaimModel>(
      NotifyClaimModel.name,
    );
    expect(notifyClaim).toBeDefined();
    expect(notifyClaim.id).toBeDefined();
  });

  afterAll(() => module.close());
});
