import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@zro/common';
import { UserLimitTrackerModel } from '@zro/operations/infrastructure';
import { UserLimitTrackerFactory } from '@zro/test/operations/config';

describe('UserLimitTrackerModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.operations.env'] }),
        DatabaseModule.forFeature([UserLimitTrackerModel]),
      ],
    }).compile();
  });

  it('TC0001 - Should be defined.', async () => {
    const userLimitTracker =
      await UserLimitTrackerFactory.create<UserLimitTrackerModel>(
        UserLimitTrackerModel.name,
      );
    expect(userLimitTracker).toBeDefined();
    expect(userLimitTracker.id).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
