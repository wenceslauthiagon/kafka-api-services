import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  ZroBankAuthGateway,
  ZroBankAuthGatewayConfig,
  ZroBankGatewayConfig,
  ZroBankPixService,
  ZroBankPixModule,
} from '@zro/zrobank';
import { BankAccountName } from '@zro/pix-zro-pay/domain';
import * as MockZroBankCreateQrCodePixPayment from '@zro/test/zrobank/mocks/create_qr_code_pix_payment_zro_bank.mock';
import * as MockZroBankAuthentication from '@zro/test/zrobank/mocks/auth.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('GetProviderName - Zro Bank', () => {
  let module: TestingModule;
  let service: ZroBankPixService;
  let configService: ConfigService<ZroBankGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.pix-zro-pay.env'] }),
        ZroBankPixModule,
      ],
    }).compile();

    service = module.get(ZroBankPixService);
    configService = module.get(ConfigService);

    const authConfig: ZroBankAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_ZROBANK_API_PAAS_BASE_URL'),
      apiId: configService.get<string>('APP_ZROBANK_API_PAAS_ID'),
      apiKey: configService.get<string>('APP_ZROBANK_API_PAAS_KEY'),
    };
    ZroBankAuthGateway.build(authConfig);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    ZroBankAuthGateway.clearTokens();
    mockAxios.post.mockImplementationOnce(MockZroBankAuthentication.oAuthToken);
  });

  it('TC0001 - Should get provider name', async () => {
    mockAxios.get.mockImplementationOnce(
      MockZroBankCreateQrCodePixPayment.success,
    );

    const bankAccountName = service.getGateway().getProviderName();

    expect(bankAccountName).toBe(BankAccountName.BANK_ZRO_BANK);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
