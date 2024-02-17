import { v4 as uuidV4 } from 'uuid';
import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import {
  EncryptService,
  MissingDataException,
  defaultLogger as logger,
} from '@zro/common';
import { SmsState } from '@zro/notifications/domain';
import {
  SmsEventEmitter,
  SmsNotFoundException,
  HandleSmsDeadLetterUseCase,
} from '@zro/notifications/application';
import {
  SmsDatabaseRepository,
  SmsModel,
} from '@zro/notifications/infrastructure';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { SmsFactory } from '@zro/test/notifications/config';

describe('Test handle created sms use case', () => {
  let module: TestingModule;

  const mockSmsEventEmitter: SmsEventEmitter = createMock<SmsEventEmitter>();
  const mockFailedEventEmitter: jest.Mock = On(mockSmsEventEmitter).get(
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
    const smsRepository = new SmsDatabaseRepository();

    const usecase = new HandleSmsDeadLetterUseCase(
      smsRepository,
      mockSmsEventEmitter,
      logger,
    );

    const handledSms = await usecase.execute(id);

    return handledSms;
  };

  it('TC0001 - Should handle sent SMS successfully', async () => {
    const sms = await SmsFactory.create<SmsModel>(SmsModel.name, {
      state: SmsState.PENDING,
    });

    const sentSms = await executeUseCase(sms.id);

    expect(sentSms).toBeDefined();
    expect(sentSms.id).toBe(sms.id);
    expect(sentSms.state).toBe(SmsState.FAILED);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(1);
    expect(mockFailedEventEmitter.mock.calls[0][0].id).toBe(sentSms.id);
  });

  it('TC0002 - Should not change SMS with already sent one', async () => {
    const sms = await SmsFactory.create<SmsModel>(SmsModel.name, {
      state: SmsState.SENT,
    });

    const sentSms = await executeUseCase(sms.id);

    expect(sentSms).toBeDefined();
    expect(sentSms.id).toBe(sms.id);
    expect(sentSms.state).toBe(SmsState.SENT);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should not change SMS with already failed one', async () => {
    const sms = await SmsFactory.create<SmsModel>(SmsModel.name, {
      state: SmsState.FAILED,
    });

    const sentSms = await executeUseCase(sms.id);

    expect(sentSms).toBeDefined();
    expect(sentSms.id).toBe(sms.id);
    expect(sentSms.state).toBe(SmsState.FAILED);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0004 - Should fail without SMS', async () => {
    await expect(executeUseCase(null)).rejects.toThrow(MissingDataException);

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not handle sent SMS with invalid id', async () => {
    await expect(executeUseCase(uuidV4())).rejects.toThrow(
      SmsNotFoundException,
    );

    expect(mockFailedEventEmitter).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
