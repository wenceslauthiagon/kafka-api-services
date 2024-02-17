import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyCompletionModel } from '@zro/api-topazio/infrastructure';
import { NotifyCompletionFactory } from '@zro/test/api-topazio/config';

describe('NotifyCompletionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyCompletionModel]),
      ],
    }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be defined', async () => {
    const notifyCompletion =
      await NotifyCompletionFactory.create<NotifyCompletionModel>(
        NotifyCompletionModel.name,
      );
    expect(notifyCompletion).toBeDefined();
    expect(notifyCompletion.transactionId).toBeDefined();
  });

  afterAll(() => module.close());
});
