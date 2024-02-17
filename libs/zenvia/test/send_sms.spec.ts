import { ConfigModule } from '@nestjs/config';
import { faker } from '@faker-js/faker/locale/pt_BR';
import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { EncryptService, MissingDataException } from '@zro/common';
import { SmsMessage } from '@zro/notifications/application';
import {
  ZenviaModule,
  ZENVIA_API,
  ZenviaService,
} from '@zro/zenvia/infrastructure';
import { zenviaSendSmsMockSuccess } from './config/mocks/send_sms.mock';

jest.mock('axios');

const mockPost: any = axios.post;
const mockCreate: any = axios.create;
mockCreate.mockImplementation(() => axios);

describe('Test send e-mail via Matraca', () => {
  let module: TestingModule;
  let zenviaService: ZenviaService;
  let encryptService: EncryptService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.zenvia.env'],
        }),
        ZenviaModule,
      ],
    }).compile();

    zenviaService = module.get(ZenviaService);
    encryptService = module.get(EncryptService);
  });

  beforeEach(() => jest.resetAllMocks());

  const sendSms = async (message: SmsMessage) => {
    const encrypted: SmsMessage = { ...message };
    encrypted.body = message.body && encryptService.encrypt(message.body);

    await zenviaService.getZenviaGateway().send(encrypted);
  };

  it('TC0001 - Should send e-mail successfully', async () => {
    const message: SmsMessage = {
      id: faker.datatype.uuid(),
      phoneNumber:
        '551198' + faker.datatype.number(9999999).toString().padStart(7, '0'),
      body: faker.lorem.paragraphs(1).substring(0, 70),
    };

    mockPost.mockImplementationOnce(zenviaSendSmsMockSuccess);

    await sendSms(message);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost.mock.calls[0][0]).toBe(ZENVIA_API.SEND);
    expect(mockPost.mock.calls[0][1].sendSmsRequest).toBeDefined();
    expect(mockPost.mock.calls[0][1].sendSmsRequest.to).toBe(
      message.phoneNumber,
    );
    expect(mockPost.mock.calls[0][1].sendSmsRequest.msg).toBe(message.body);
    expect(mockPost.mock.calls[0][1].sendSmsRequest.id).toBe(message.id);
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
