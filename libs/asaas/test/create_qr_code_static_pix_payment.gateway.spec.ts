import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AsaasPixModule, AsaasPixService } from '@zro/asaas';
import { CreateQrCodePixPaymentPspRequest } from '@zro/pix-zro-pay/application';
import { BankAccountEntity, QrCodeFormat } from '@zro/pix-zro-pay/domain';
import * as MockAsaasCreateQrCodePixPayment from '@zro/test/asaas/mocks/create_qr_code_static_pix_payment.gateway.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('CreateQrCodePixPayment - Asaas', () => {
  let module: TestingModule;
  let service: AsaasPixService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-zro-pay.env'] }),
        AsaasPixModule,
      ],
    }).compile();

    service = module.get(AsaasPixService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('TC0001 - Should create Qr Code with valid data', async () => {
    mockAxios.post.mockImplementationOnce(
      MockAsaasCreateQrCodePixPayment.success,
    );

    const body: CreateQrCodePixPaymentPspRequest = {
      expirationSeconds: faker.datatype.number(),
      bankAccount: new BankAccountEntity({
        pixKey: faker.datatype.string(),
      }),
      description: faker.datatype.string(),
      value: faker.datatype.number(),
      format: QrCodeFormat.PAYLOAD,
    };

    const result = await service.getGateway().createQrCode(body);

    expect(result).toBeDefined();
    expect(result.emv).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.expirationDate).toBeDefined();
  });

  it('TC0002 - Should throw error when QR Code creating fails', async () => {
    mockAxios.post.mockImplementation(() => {
      throw new Error();
    });

    const body: CreateQrCodePixPaymentPspRequest = {
      expirationSeconds: faker.datatype.number(),
      bankAccount: new BankAccountEntity({
        pixKey: faker.datatype.string(),
      }),
      description: faker.datatype.string(),
      value: faker.datatype.number(),
      format: QrCodeFormat.PAYLOAD,
    };

    const result = service.getGateway().createQrCode(body);

    await expect(result).rejects.toThrow();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
