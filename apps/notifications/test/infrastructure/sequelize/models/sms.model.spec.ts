import { Test, TestingModule } from '@nestjs/testing';
import { SmsModel } from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { SmsState } from '@zro/notifications/domain';
import { SmsFactory } from '@zro/test/notifications/config';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { EncryptService } from '@zro/common';

describe('SmsModel', () => {
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
    const sms = await SmsFactory.create<SmsModel>(SmsModel.name);
    expect(sms).toBeDefined();
    expect(sms.id).toBeDefined();
  });

  it('TC0002 - should get a sent sms', async () => {
    const sms = await SmsFactory.create<SmsModel>(SmsModel.name, {
      state: SmsState.SENT,
    });
    expect(sms).toBeDefined();
    expect(sms.id).toBeDefined();
    expect(sms.state).toBe(SmsState.SENT);
  });

  afterAll(async () => await module.close());
});
