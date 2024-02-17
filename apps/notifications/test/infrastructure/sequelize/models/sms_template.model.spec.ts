import { Test, TestingModule } from '@nestjs/testing';
import { SmsTemplateModel } from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { SmsTemplateFactory } from '@zro/test/notifications/config';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { EncryptService } from '@zro/common';

describe('SmsTemplateModel', () => {
  let module: TestingModule;

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
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
    const sms = await SmsTemplateFactory.create<SmsTemplateModel>(
      SmsTemplateModel.name,
    );
    expect(sms).toBeDefined();
    expect(sms.id).toBeDefined();
    expect(sms.markups).toEqual(expect.arrayContaining(['key', 'code']));
  });

  afterAll(() => module.close());
});
