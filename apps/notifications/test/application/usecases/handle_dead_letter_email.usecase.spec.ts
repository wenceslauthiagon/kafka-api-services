import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  EncryptService,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { EmailState } from '@zro/notifications/domain';
import {
  EmailEventEmitter,
  EmailNotFoundException,
  HandleEmailDeadLetterUseCase,
} from '@zro/notifications/application';
import {
  EmailDatabaseRepository,
  EmailModel,
} from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { EmailFactory } from '@zro/test/notifications/config';

describe('Test handle created email use case', () => {
  let module: TestingModule;

  const mockEmailEventEmitter: EmailEventEmitter =
    createMock<EmailEventEmitter>();
  const mockFailedEventEmitter: jest.Mock = On(mockEmailEventEmitter).get(
    method((mock) => mock.emitFailedEvent),
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

  const executeUseCase = async (id: string) => {
    const emailRepository = new EmailDatabaseRepository();

    const usecase = new HandleEmailDeadLetterUseCase(
      emailRepository,
      mockEmailEventEmitter,
      logger,
    );

    const handledEmail = await usecase.execute(id);

    return handledEmail;
  };

  it('TC0001 - Should handle sent e-mail successfully', async () => {
    const email = await EmailFactory.create<EmailModel>(EmailModel.name, {
      state: EmailState.PENDING,
    });

    const sentEmail = await executeUseCase(email.id);

    expect(sentEmail).toBeDefined();
    expect(sentEmail.id).toBe(email.id);
    expect(sentEmail.state).toBe(EmailState.FAILED);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockFailedEventEmitter.mock.calls[0][0].id).toBe(sentEmail.id);
  });

  it('TC0002 - Should not change e-mail with already sent one', async () => {
    const email = await EmailFactory.create<EmailModel>(EmailModel.name, {
      state: EmailState.SENT,
    });

    const sentEmail = await executeUseCase(email.id);

    expect(sentEmail).toBeDefined();
    expect(sentEmail.id).toBe(email.id);
    expect(sentEmail.state).toBe(EmailState.SENT);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should not change e-mail with already failed one', async () => {
    const email = await EmailFactory.create<EmailModel>(EmailModel.name, {
      state: EmailState.FAILED,
    });

    const sentEmail = await executeUseCase(email.id);

    expect(sentEmail).toBeDefined();
    expect(sentEmail.id).toBe(email.id);
    expect(sentEmail.state).toBe(EmailState.FAILED);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0004 - Should fail without e-mail', async () => {
    await expect(executeUseCase(null)).rejects.toThrow(MissingDataException);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not handle sent e-mail with invalid id', async () => {
    await expect(executeUseCase(uuidV4())).rejects.toThrow(
      EmailNotFoundException,
    );

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
