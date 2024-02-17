import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, EncryptService } from '@zro/common';
import {
  EmailRepository,
  EmailState,
  EmailTemplateRepository,
} from '@zro/notifications/domain';
import {
  EmailDatabaseRepository,
  CreateEmailMicroserviceController as Controller,
  EmailTemplateDatabaseRepository,
  EmailTemplateModel,
} from '@zro/notifications/infrastructure';
import {
  CreateEmailRequest,
  EmailEventEmitterController,
} from '@zro/notifications/interface';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { EmailTemplateFactory } from '@zro/test/notifications/config';
import { KafkaContext } from '@nestjs/microservices';

describe('EmailController', () => {
  let module: TestingModule;
  let controller: Controller;
  let emailRepository: EmailRepository;
  let emailTemplateRepository: EmailTemplateRepository;

  const mockEmailEventEmitter: EmailEventEmitterController =
    createMock<EmailEventEmitterController>();
  const mockCreateEmailEventEmitter: jest.Mock = On(mockEmailEventEmitter).get(
    method((mock) => mock.emitEmailCreatedEvent),
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
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();
    controller = module.get<Controller>(Controller);
    emailRepository = new EmailDatabaseRepository();
    emailTemplateRepository = new EmailTemplateDatabaseRepository();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  it('TC0001 - should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Created e-mail', () => {
    describe('With valid parameters', () => {
      it('TC0002 - Should create e-mail successfully', async () => {
        const template = await EmailTemplateFactory.create<EmailTemplateModel>(
          EmailTemplateModel.name,
        );

        const message: CreateEmailRequest = {
          id: uuidV4(),
          to: 'to-test@example.com',
          from: 'to-test@example.com',
          tag: template.tag,
          data: { key: '__test_key__', code: '__test_code__' },
          userId: uuidV4(),
          issuedBy: uuidV4(),
        };

        const created = await controller.execute(
          message,
          emailRepository,
          emailTemplateRepository,
          mockEmailEventEmitter,
          logger,
          ctx,
        );

        expect(created).toBeDefined();
        expect(created.ctx).toBeDefined();
        expect(created.value).toBeDefined();
        expect(created.value.id).toBe(message.id);
        expect(created.value.to).toBe(message.to);
        expect(created.value.from).toBe(message.from);
        expect(created.value.state).toBe(EmailState.PENDING);
        expect(mockCreateEmailEventEmitter).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
