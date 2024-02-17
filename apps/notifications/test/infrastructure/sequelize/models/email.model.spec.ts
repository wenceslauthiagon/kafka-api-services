import { Test, TestingModule } from '@nestjs/testing';
import { EmailModel } from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { EmailState } from '@zro/notifications/domain';
import { EmailFactory } from '@zro/test/notifications/config';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';
import { EncryptService } from '@zro/common';

describe('EmailModel', () => {
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
    const email = await EmailFactory.create<EmailModel>(EmailModel.name);
    expect(email).toBeDefined();
    expect(email.id).toBeDefined();
  });

  it('TC0002 - should get a sent email', async () => {
    const email = await EmailFactory.create<EmailModel>(EmailModel.name, {
      state: EmailState.SENT,
    });
    expect(email).toBeDefined();
    expect(email.id).toBeDefined();
    expect(email.state).toBe(EmailState.SENT);
  });

  afterAll(() => module.close());
});
