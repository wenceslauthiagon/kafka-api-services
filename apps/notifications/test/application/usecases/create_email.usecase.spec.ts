import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  defaultLogger as logger,
  EncryptService,
  MissingDataException,
} from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { EmailState } from '@zro/notifications/domain';
import {
  CreateEmailUseCase,
  EmailTemplateTagNotFoundException,
  EmailEventEmitter,
} from '@zro/notifications/application';
import {
  EmailDatabaseRepository,
  EmailTemplateDatabaseRepository,
  EmailTemplateModel,
} from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { EmailTemplateFactory } from '@zro/test/notifications/config';

describe('Test create email use case', () => {
  let module: TestingModule;

  const emailEventEmitter: EmailEventEmitter = createMock<EmailEventEmitter>();
  const mockEventEmitter: jest.Mock = On(emailEventEmitter).get(
    method((mock) => mock.emitCreatedEvent),
  );

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

  const executeUseCase = async ({
    id,
    to,
    from,
    tag,
    data,
    user,
    issuedBy,
  }: {
    id: string;
    to: string;
    from: string;
    tag: string;
    data?: Record<string, string>;
    user?: User;
    issuedBy?: string;
  }) => {
    const emailRepository = new EmailDatabaseRepository();
    const emailTemplateRepository = new EmailTemplateDatabaseRepository();

    const sendEmailUseCase = new CreateEmailUseCase(
      emailRepository,
      emailTemplateRepository,
      emailEventEmitter,
      encryptService,
      logger,
    );

    const email = await sendEmailUseCase.execute(
      id,
      to,
      from,
      tag,
      data,
      user,
      issuedBy,
    );

    return email;
  };

  it('TC0001 - Should create e-mail with valid template', async () => {
    const template = await EmailTemplateFactory.create<EmailTemplateModel>(
      EmailTemplateModel.name,
    );

    const email = {
      id: uuidV4(),
      to: 'to-test@example.com',
      from: 'to-test@example.com',
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: uuidV4() }),
      issuedBy: uuidV4(),
    };

    const sentEmail = await executeUseCase(email);

    expect(sentEmail).toBeDefined();
    expect(sentEmail.id).toBe(email.id);
    expect(sentEmail.to).toBe(email.to);
    expect(sentEmail.from).toBe(email.from);
    expect(encryptService.decrypt(sentEmail.title)).toContain('__test_key__');
    expect(encryptService.decrypt(sentEmail.body)).toContain('__test_code__');
    expect(sentEmail.html).toBeNull();
    expect(sentEmail.state).toBe(EmailState.PENDING);

    expect(mockEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockEventEmitter.mock.calls[0][0].id).toBe(sentEmail.id);
  });

  it('TC0002 - Should not create e-mail with invalid template', async () => {
    const email = {
      id: uuidV4(),
      to: 'to-test@example.com',
      from: 'to-test@example.com',
      tag: 'XXXXX',
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: uuidV4() }),
      issuedBy: uuidV4(),
    };

    await expect(executeUseCase(email)).rejects.toThrow(
      EmailTemplateTagNotFoundException,
    );

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should not create e-mail without template', async () => {
    const email = {
      id: uuidV4(),
      to: 'to-test@example.com',
      from: 'to-test@example.com',
      tag: null,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: uuidV4() }),
      issuedBy: uuidV4(),
    };

    await expect(executeUseCase(email)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0004 - Should not create e-mail without to address', async () => {
    const template = await EmailTemplateFactory.create<EmailTemplateModel>(
      EmailTemplateModel.name,
    );

    const email = {
      id: uuidV4(),
      to: null,
      from: 'to-test@example.com',
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: uuidV4() }),
      issuedBy: uuidV4(),
    };

    await expect(executeUseCase(email)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not create e-mail without from address', async () => {
    const template = await EmailTemplateFactory.create<EmailTemplateModel>(
      EmailTemplateModel.name,
    );

    const email = {
      id: uuidV4(),
      to: 'from-test@example.com',
      from: null,
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: uuidV4() }),
      issuedBy: uuidV4(),
    };

    await expect(executeUseCase(email)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0006 - Should not create e-mail without id', async () => {
    const template = await EmailTemplateFactory.create<EmailTemplateModel>(
      EmailTemplateModel.name,
    );

    const email = {
      id: null,
      to: 'from-test@example.com',
      from: null,
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: uuidV4() }),
      issuedBy: uuidV4(),
    };

    await expect(executeUseCase(email)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
