import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService, MissingDataException } from '@zro/common';
import { SmsMessage } from '@zro/notifications/application';
import {
  BulksmsModule,
  BULKSMS_API,
  BulksmsService,
} from '@zro/bulksms/infrastructure';
import { bulksmsSendSmsMockSuccess } from './config/mocks/send_sms.mock';

jest.mock('axios');

const mockPost: any = axios.post;
const mockCreate: any = axios.create;
mockCreate.mockImplementation(() => axios);

describe('Test send SMS via Bulksms', () => {
  let module: TestingModule;
  let bulksmsService: BulksmsService;
  let encryptService: EncryptService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.bulksms.env'],
        }),
        BulksmsModule,
      ],
    }).compile();

    bulksmsService = module.get(BulksmsService);
    encryptService = module.get(EncryptService);
  });

  beforeEach(() => jest.resetAllMocks());

  const sendSms = async (message: SmsMessage) => {
    const encrypted: SmsMessage = { ...message };
    encrypted.body = message.body && encryptService.encrypt(message.body);

    await bulksmsService.getBulksmsGateway().send(encrypted);
  };

  it('TC0001 - Should send sms successfully', async () => {
    const message: SmsMessage = {
      id: faker.datatype.uuid(),
      phoneNumber:
        '+551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      body: faker.lorem.paragraphs(1).substring(0, 70),
    };

    mockPost.mockImplementationOnce(bulksmsSendSmsMockSuccess);

    await sendSms(message);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe(BULKSMS_API.SEND);
    expect(mockPost.mock.calls[0][1].to).toBe(message.phoneNumber);
    expect(mockPost.mock.calls[0][1].body).toBe(message.body);
  });

  it('TC0002 - Should fail without phone number', async () => {
    const message: SmsMessage = {
      id: faker.datatype.uuid(),
      phoneNumber: null,
      body: faker.lorem.paragraphs(1),
    };

    await expect(sendSms(message)).rejects.toThrow(MissingDataException);

    expect(mockPost).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should fail without body', async () => {
    const message: SmsMessage = {
      id: faker.datatype.uuid(),
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      body: null,
    };

    await expect(sendSms(message)).rejects.toThrow(MissingDataException);

    expect(mockPost).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should fail without id', async () => {
    const message: SmsMessage = {
      id: null,
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      body: faker.lorem.paragraphs(1),
    };

    await expect(sendSms(message)).rejects.toThrow(MissingDataException);

    expect(mockPost).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
