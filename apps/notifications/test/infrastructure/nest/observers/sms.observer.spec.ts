import { createMock } from 'ts-auto-mock';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService } from '@zro/common';
import {
  SmsDatabaseRepository,
  SmsModel,
  CreatedSmsNestObserver,
} from '@zro/notifications/infrastructure';
import { SmsRepository, SmsState } from '@zro/notifications/domain';
import { SmsGateway } from '@zro/notifications/application';
import {
  HandleSmsCreatedRequest,
  SmsEventEmitterController,
} from '@zro/notifications/interface';
import { AppModule } from '@zro/notifications/infrastructure/nest/modules/app.module';
import { defaultLogger as logger } from '@zro/common';
import { SmsFactory } from '@zro/test/notifications/config';
import { KafkaContext } from '@nestjs/microservices';

describe('SmsController', () => {
  let module: TestingModule;
  let observer: CreatedSmsNestObserver;
  let smsRepository: SmsRepository;

  const mockSmsEventEmitter: SmsEventEmitterController =
    createMock<SmsEventEmitterController>();
  const mockSentSmsEventEmitter: jest.Mock = On(mockSmsEventEmitter).get(
    method((mock) => mock.emitSmsSentEvent),
  );

  const mockFailedSmsEventEmitter: jest.Mock = On(mockSmsEventEmitter).get(
    method((mock) => mock.emitSmsFailedEvent),
  );

  const mockSmsGateway: SmsGateway = createMock<SmsGateway>();
  const mockSendSmsGateway: jest.Mock = On(mockSmsGateway).get(
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
      .overrideProvider(EncryptService)
      .useValue(encryptService)
      .compile();

    observer = module.get(CreatedSmsNestObserver);

    smsRepository = new SmsDatabaseRepository();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockEncryptService.mockImplementation((m) => m);
    mockDecryptService.mockImplementation((m) => m);
  });

  it('TC0001 - should be defined', () => {
    expect(observer).toBeDefined();
  });

  describe('Handle created SMS event', () => {
    describe('With valid parameters', () => {
      it('TC0002 - Should handle created SMS successfully', async () => {
        const sms = await SmsFactory.create<SmsModel>(SmsModel.name, {
          state: SmsState.PENDING,
        });

        const message: HandleSmsCreatedRequest = {
          id: sms.id,
          phoneNumber: sms.phoneNumber,
          state: sms.state,
          body: sms.body,
        };

        await observer.handleSmsCreatedEventViaZenvia(
          message,
          smsRepository,
          mockSmsEventEmitter,
          logger,
          mockSmsGateway,
          ctx,
        );

        expect(mockSentSmsEventEmitter).toHaveBeenCalledTimes(1);
        expect(mockSendSmsGateway).toHaveBeenCalledTimes(1);
        expect(mockFailedSmsEventEmitter).toHaveBeenCalledTimes(0);

        expect(mockSentSmsEventEmitter.mock.calls[0][0].id).toBe(sms.id);
        expect(mockSentSmsEventEmitter.mock.calls[0][0].state).toBe(
          SmsState.SENT,
        );
        expect(mockSendSmsGateway.mock.calls[0][0].id).toBe(sms.id);
      });
    });
  });

  describe('Handle dead letter SMS event', () => {
    describe('With valid parameters', () => {
      it('TC0003 - Should handle dead letter SMS successfully', async () => {
        const sms = await SmsFactory.create<SmsModel>(SmsModel.name, {
          state: SmsState.PENDING,
        });

        const message: HandleSmsCreatedRequest = {
          id: sms.id,
          phoneNumber: sms.phoneNumber,
          state: sms.state,
          body: sms.body,
        };

        await observer.handleSmsDeadLetterEvent(
          message,
          smsRepository,
          mockSmsEventEmitter,
          logger,
        );

        expect(mockSendSmsGateway).toHaveBeenCalledTimes(0);
        expect(mockSentSmsEventEmitter).toHaveBeenCalledTimes(0);
        expect(mockFailedSmsEventEmitter).toHaveBeenCalledTimes(1);

        expect(mockFailedSmsEventEmitter.mock.calls[0][0].id).toBe(sms.id);
        expect(mockFailedSmsEventEmitter.mock.calls[0][0].state).toBe(
          SmsState.FAILED,
        );
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
