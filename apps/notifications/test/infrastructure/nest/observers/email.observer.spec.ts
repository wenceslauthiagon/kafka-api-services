import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService, defaultLogger as logger } from '@zro/common';
import { EmailRepository, EmailState } from '@zro/notifications/domain';
import { SmtpGateway } from '@zro/notifications/application';
import {
  EmailAttr,
  EmailEventEmitterController,
} from '@zro/notifications/interface';
import {
  EmailCreatedEventDto,
  EmailDatabaseRepository,
  EmailDeadLetterEventDto,
  EmailModel,
  EmailNestObserver,
} from '@zro/notifications/infrastructure';
import { MatracaService } from '@zro/matraca';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { EmailFactory } from '@zro/test/notifications/config';
import { KafkaContext } from '@nestjs/microservices';

describe('EmailController', () => {
  let module: TestingModule;
  let observer: EmailNestObserver;
  let emailRepository: EmailRepository;

  const mockEmailEventEmitter: EmailEventEmitterController =
    createMock<EmailEventEmitterController>();
  const mockSentEmailEventEmitter: jest.Mock = On(mockEmailEventEmitter).get(
    method((mock) => mock.emitEmailSentEvent),
  );
  const mockFailedEmailEventEmitter: jest.Mock = On(mockEmailEventEmitter).get(
    method((mock) => mock.emitEmailFailedEvent),
  );

  const mockSmtpGateway: SmtpGateway = createMock<SmtpGateway>();
  const mockSendSmtpGateway: jest.Mock = On(mockSmtpGateway).get(
    method((mock) => mock.send),
  );

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MatracaService)
      .useValue(mockSmtpGateway)
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();

    observer = module.get(EmailNestObserver);
    emailRepository = new EmailDatabaseRepository();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  it('TC0001 - should be defined', () => {
    expect(observer).toBeDefined();
  });

  describe('Handle created e-mail event', () => {
    describe('With valid parameters', () => {
      it('TC0002 - Should handle created e-mail successfully', async () => {
        const email = await EmailFactory.create<EmailModel>(EmailModel.name, {
          state: EmailState.PENDING,
        });

        const { id, to, from, state, title, body, html } = email;

        const emailCreatedEvent: EmailAttr = {
          id,
          to,
          from,
          state,
          title,
          body,
          html,
        };

        const message: EmailCreatedEventDto = {
          id: emailCreatedEvent.id,
          to: emailCreatedEvent.to,
          from: emailCreatedEvent.from,
          state: emailCreatedEvent.state,
          title: emailCreatedEvent.title,
          body: emailCreatedEvent.body,
          html: emailCreatedEvent.html,
        };

        await observer.handleEmailCreatedEventViaMatraca(
          message,
          emailRepository,
          mockEmailEventEmitter,
          logger,
          mockSmtpGateway,
          ctx,
        );

        expect(mockSentEmailEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockSendSmtpGateway).toHaveBeenCalledTimes(1);
        expect(mockFailedEmailEventEmitter).toHaveBeenCalledTimes(0);

        expect(mockSentEmailEventEmitter.mock.calls[0][0].id).toBe(email.id);
        expect(mockSentEmailEventEmitter.mock.calls[0][0].state).toBe(
          EmailState.SENT,
        );
        expect(mockSendSmtpGateway.mock.calls[0][0].id).toBe(email.id);
      });
    });
  });

  describe('Handle dead letter e-mail event', () => {
    describe('With valid parameters', () => {
      it('TC0003 - Should handle dead letter e-mail successfully', async () => {
        const email = await EmailFactory.create<EmailModel>(EmailModel.name, {
          state: EmailState.PENDING,
        });

        const { id, to, from, state, title, body, html } = email;

        const event: EmailAttr = {
          id,
          to,
          from,
          state,
          title,
          body,
          html,
        };

        const message: EmailDeadLetterEventDto = {
          id: event.id,
          to: event.to,
          from: event.from,
          state: event.state,
          title: event.title,
          body: event.body,
          html: event.html,
        };

        await observer.handleEmailDeadLetterEvent(
          message,
          emailRepository,
          mockEmailEventEmitter,
          logger,
        );

        expect(mockSendSmtpGateway).toHaveBeenCalledTimes(0);
        expect(mockSentEmailEventEmitter).toHaveBeenCalledTimes(0);
        expect(mockFailedEmailEventEmitter).toHaveBeenCalledTimes(1);

        expect(mockFailedEmailEventEmitter.mock.calls[0][0].id).toBe(email.id);
        expect(mockFailedEmailEventEmitter.mock.calls[0][0].state).toBe(
          EmailState.FAILED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
