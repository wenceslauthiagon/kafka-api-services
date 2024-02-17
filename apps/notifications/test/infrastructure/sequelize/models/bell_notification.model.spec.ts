import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService } from '@zro/common';
import { BellNotificationModel } from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { BellNotificationFactory } from '@zro/test/notifications/config';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';

describe('BellNotificationModel', () => {
  let module: TestingModule;

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  it('TC0001 - should be defined', async () => {
    const bellNotification =
      await BellNotificationFactory.create<BellNotificationModel>(
        BellNotificationModel.name,
      );
    expect(bellNotification).toBeDefined();
    expect(bellNotification.id).toBeDefined();
    expect(bellNotification.title).toBeDefined();
    expect(bellNotification.description).toBeDefined();
    expect(bellNotification.userId).toBeDefined();
    expect(bellNotification.type).toBeDefined();
    expect(bellNotification.read).toBeDefined();
  });

  afterAll(() => module.close());
});
