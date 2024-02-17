import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService, defaultLogger as logger } from '@zro/common';
import {
  SmsRepository,
  SmsState,
  SmsTemplateRepository,
} from '@zro/notifications/domain';
import {
  SmsDatabaseRepository,
  CreateSmsMicroserviceController as Controller,
  SmsTemplateDatabaseRepository,
  SmsTemplateModel,
} from '@zro/notifications/infrastructure';
import {
  CreateSmsRequest,
  SmsEventEmitterController,
} from '@zro/notifications/interface';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { SmsTemplateFactory } from '@zro/test/notifications/config';
import { KafkaContext } from '@nestjs/microservices';

describe('SmsController', () => {
  let module: TestingModule;
  let controller: Controller;
  let smsRepository: SmsRepository;
  let smsTemplateRepository: SmsTemplateRepository;

  const mockSmsEventEmitter: SmsEventEmitterController =
    createMock<SmsEventEmitterController>();
  const mockCreateSmsEventEmitter: jest.Mock = On(mockSmsEventEmitter).get(
    method((mock) => mock.emitSmsCreatedEvent),
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
    smsRepository = new SmsDatabaseRepository();
    smsTemplateRepository = new SmsTemplateDatabaseRepository();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  it('TC0001 - should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Created SMS', () => {
    describe('With valid parameters', () => {
      it('TC0002 - Should create SMS successfully', async () => {
        const template = await SmsTemplateFactory.create<SmsTemplateModel>(
          SmsTemplateModel.name,
        );

        const message: CreateSmsRequest = {
          id: faker.datatype.uuid(),
          phoneNumber:
            '+551198' +
            faker.datatype.number(9999999).toString().padStart(7, '0'),
          tag: template.tag,
          data: { key: '__test_key__', code: '__test_code__' },
          userId: faker.datatype.uuid(),
          issuedBy: faker.datatype.uuid(),
        };

        const created = await controller.execute(
          message,
          smsRepository,
          smsTemplateRepository,
          mockSmsEventEmitter,
          logger,
          ctx,
        );

        expect(created).toBeDefined();
        expect(created.ctx).toBeDefined();
        expect(created.value).toBeDefined();
        expect(created.value.id).toBe(message.id);
        expect(created.value.phoneNumber).toBe(message.phoneNumber);
        expect(created.value.state).toBe(SmsState.PENDING);
        expect(mockCreateSmsEventEmitter).toHaveBeenCalledTimes(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
