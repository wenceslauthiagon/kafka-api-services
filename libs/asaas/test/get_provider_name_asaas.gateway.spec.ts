import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { AsaasPixModule, AsaasPixService } from '@zro/asaas';
import { BankAccountName } from '@zro/pix-zro-pay/domain';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetProviderName - Asaas', () => {
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
    const paymentGatewayName = service.getGateway().getProviderName();

    expect(paymentGatewayName).toBe(BankAccountName.BANK_ASAAS);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
