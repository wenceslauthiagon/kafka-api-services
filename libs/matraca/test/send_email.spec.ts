import { faker } from '@faker-js/faker/locale/pt_BR';
import * as nodemailer from 'nodemailer';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EncryptService, MissingDataException } from '@zro/common';
import { MatracaModule, MatracaService } from '@zro/matraca';
import { SmtpMessage } from '@zro/notifications/application';

jest.mock('nodemailer');
const mockCreateTransport: any = nodemailer.createTransport;
const mockSendEmail = jest.fn();
mockCreateTransport.mockReturnValue({ sendMail: mockSendEmail });

describe('Test send e-mail via Matraca', () => {
  let module: TestingModule;
  let smtpGateway: MatracaService;
  let encryptService: EncryptService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.matraca.env'] }),
        MatracaModule,
      ],
    }).compile();

    smtpGateway = module.get(MatracaService);
    encryptService = module.get(EncryptService);
  });

  beforeEach(() => jest.resetAllMocks());

  const sendMail = async (message: SmtpMessage) => {
    const encrypted: SmtpMessage = { ...message };
    encrypted.title = message.title && encryptService.encrypt(message.title);
    encrypted.body = message.body && encryptService.encrypt(message.body);
    encrypted.html = message.html && encryptService.encrypt(message.html);

    await smtpGateway.getMatracaGateway().send(encrypted);
  };

  it('TC0001 - Should send e-mail successfully', async () => {
    const message: SmtpMessage = {
      id: faker.datatype.uuid(),
      to: faker.internet.email(),
      from: 'dev-no-reply@zrobank.biz',
      title: faker.lorem.words(3),
      body: faker.lorem.paragraphs(3),
      html: `<html><body>${faker.lorem.paragraphs(3)}</body></html>`,
    };

    await sendMail(message);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail.mock.calls[0][0].to).toBe(message.to);
    expect(mockSendEmail.mock.calls[0][0].from).toBe(message.from);
    expect(mockSendEmail.mock.calls[0][0].subject).toBe(message.title);
    expect(mockSendEmail.mock.calls[0][0].text).toBe(message.body);
    expect(mockSendEmail.mock.calls[0][0].html).toBe(message.html);
  });

  it('TC0002 - Should fail without to', async () => {
    const message: SmtpMessage = {
      id: faker.datatype.uuid(),
      to: null,
      from: 'dev-no-reply@zrobank.biz',
      title: faker.lorem.words(3),
      body: faker.lorem.paragraphs(3),
      html: `<html><body>${faker.lorem.paragraphs(3)}</body></html>`,
    };

    await expect(sendMail(message)).rejects.toThrow(MissingDataException);

    expect(mockSendEmail).toHaveBeenCalledTimes(0);
  });

  it('TC0003 - Should fail without to', async () => {
    const message: SmtpMessage = {
      id: faker.datatype.uuid(),
      to: faker.internet.email(),
      from: null,
      title: faker.lorem.words(3),
      body: faker.lorem.paragraphs(3),
      html: `<html><body>${faker.lorem.paragraphs(3)}</body></html>`,
    };

    await expect(sendMail(message)).rejects.toThrow(MissingDataException);

    expect(mockSendEmail).toHaveBeenCalledTimes(0);
  });

  // it('TC0005 - Should not handle sent e-mail with invalid id', async () => {
  //   await expect(executeUseCase(faker.datatype.uuid())).rejects.toThrow(
  //     EmailNotFoundException,
  //   );

  //   expect(mockEventEmitter).toHaveBeenCalledTimes(0);
  // });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
