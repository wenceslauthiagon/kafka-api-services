import { faker } from '@faker-js/faker/locale/pt_BR';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import {
  EncryptService,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { SmsState } from '@zro/notifications/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  CreateSmsUseCase,
  SmsTemplateTagNotFoundException,
  SmsEventEmitter,
} from '@zro/notifications/application';
import {
  SmsDatabaseRepository,
  SmsTemplateDatabaseRepository,
  SmsTemplateModel,
} from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { SmsTemplateFactory } from '@zro/test/notifications/config';

describe('Test create sms use case', () => {
  let module: TestingModule;

  const encryptService: EncryptService = createMock<EncryptService>();
  const mockEncryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.encrypt),
  );
  const mockDecryptService: jest.Mock = On(encryptService).get(
    method((mock) => mock.decrypt),
  );

  const smsEventEmitter: SmsEventEmitter = createMock<SmsEventEmitter>();
  const mockEventEmitter: jest.Mock = On(smsEventEmitter).get(
    method((mock) => mock.emitCreatedEvent),
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
    phoneNumber,
    tag,
    data,
    user,
    issuedBy,
  }: {
    id: string;
    phoneNumber: string;
    tag: string;
    data?: Record<string, string>;
    user?: User;
    issuedBy?: string;
  }) => {
    const smsRepository = new SmsDatabaseRepository();
    const smsTemplateRepository = new SmsTemplateDatabaseRepository();

    const sendSmsUseCase = new CreateSmsUseCase(
      smsRepository,
      smsTemplateRepository,
      smsEventEmitter,
      encryptService,
      logger,
    );

    const sms = await sendSmsUseCase.execute(
      id,
      phoneNumber,
      tag,
      data,
      user,
      issuedBy,
    );

    return sms;
  };

  it('TC0001 - Should create SMS with valid template', async () => {
    const template = await SmsTemplateFactory.create<SmsTemplateModel>(
      SmsTemplateModel.name,
    );

    const sms = {
      id: faker.datatype.uuid(),
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      from: 'phoneNumber-test@example.com',
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      issuedBy: faker.datatype.uuid(),
    };

    const sentSms = await executeUseCase(sms);

    expect(sentSms).toBeDefined();
    expect(sentSms.id).toBe(sms.id);
    expect(sentSms.phoneNumber).toBe(sms.phoneNumber);
    expect(encryptService.decrypt(sentSms.body)).toContain('__test_key__');
    expect(encryptService.decrypt(sentSms.body)).toContain('__test_code__');
    expect(sentSms.state).toBe(SmsState.PENDING);

    expect(mockEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockEventEmitter.mock.calls[0][0].id).toBe(sentSms.id);
  });

  it('TC0002 - Should not create SMS with invalid template', async () => {
    const sms = {
      id: faker.datatype.uuid(),
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      tag: 'XXXXX',
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      issuedBy: faker.datatype.uuid(),
    };

    await expect(executeUseCase(sms)).rejects.toThrow(
      SmsTemplateTagNotFoundException,
    );

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should not create SMS without template', async () => {
    const sms = {
      id: faker.datatype.uuid(),
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      tag: null,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      issuedBy: faker.datatype.uuid(),
    };

    await expect(executeUseCase(sms)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0004 - Should not create SMS without phone number', async () => {
    const template = await SmsTemplateFactory.create<SmsTemplateModel>(
      SmsTemplateModel.name,
    );

    const sms = {
      id: faker.datatype.uuid(),
      phoneNumber: null,
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      issuedBy: faker.datatype.uuid(),
    };

    await expect(executeUseCase(sms)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not create SMS without id', async () => {
    const template = await SmsTemplateFactory.create<SmsTemplateModel>(
      SmsTemplateModel.name,
    );

    const sms = {
      id: null,
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      tag: template.tag,
      data: { key: '__test_key__', code: '__test_code__' },
      user: new UserEntity({ uuid: faker.datatype.uuid() }),
      issuedBy: faker.datatype.uuid(),
    };

    await expect(executeUseCase(sms)).rejects.toThrow(MissingDataException);

    expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
