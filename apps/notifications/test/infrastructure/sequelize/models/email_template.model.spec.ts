import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService } from '@zro/common';
import { EmailTemplateModel } from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { EmailTemplateFactory } from '@zro/test/notifications/config';
import { createMock } from 'ts-auto-mock';
import { On, method } from 'ts-auto-mock/extension';

describe('EmailTemplateModel', () => {
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
    const email = await EmailTemplateFactory.create<EmailTemplateModel>(
      EmailTemplateModel.name,
    );
    expect(email).toBeDefined();
    expect(email.id).toBeDefined();
    expect(email.markups).toEqual(expect.arrayContaining(['key', 'code']));
  });

  afterAll(() => module.close());
});
