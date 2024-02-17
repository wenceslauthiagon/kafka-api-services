import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { GenialPixService, GenialPixModule } from '@zro/genial';
import { BankAccountName } from '@zro/pix-zro-pay/domain';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetProviderName - Genial', () => {
  let module: TestingModule;
  let createQrCodePixPayment: GenialPixService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-zro-pay.env'] }),
        GenialPixModule,
      ],
    }).compile();

    createQrCodePixPayment = module.get(GenialPixService);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('TC0001 - Should get provider name successfully', async () => {
    const result = createQrCodePixPayment.getGateway().getProviderName();

    expect(result).toBe(BankAccountName.BANK_GENIAL);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
