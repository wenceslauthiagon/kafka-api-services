import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { cpf } from 'cpf-cnpj-validator';
import { KeyType } from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import {
  CreatePortabilityClaimPspRequest,
  OfflinePixKeyPspException,
  PixKeyPspException,
} from '@zro/pix-keys/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCreatePortabilityClaimPixKey from './mocks/create_portability_claim_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createPortabilityClaimPixKey', () => {
  let module: TestingModule;
  let pixKeyService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixKeyService = module.get(JdpiPixService);
    configService = module.get(ConfigService);

    const authConfig: JdpiAuthGatewayConfig = {
      appEnv: configService.get<string>('APP_ENV'),
      baseUrl: configService.get<string>('APP_JDPI_BASE_URL'),
      clientId: configService.get<string>('APP_JDPI_AUTH_CLIENT_ID'),
      clientSecret: configService.get<string>('APP_JDPI_AUTH_CLIENT_SECRET'),
    };
    JdpiAuthGateway.build(authConfig);
  });

  beforeEach(() => {
    JdpiAuthGateway.clearTokens();
    mockAxios.post.mockReset();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should send createPortabilityClaimPixKey successfully', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePortabilityClaimPixKey.success,
    );

    const body: CreatePortabilityClaimPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.fullName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: new Date(),
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    await pixKeyService.getPixKeyGateway().createPortabilityClaim(body);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send createPortabilityClaimPixKey after offline response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePortabilityClaimPixKey.offline,
    );

    const body: CreatePortabilityClaimPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.fullName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: new Date(),
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPortabilityClaim(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send createPortabilityClaimPixKey after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePortabilityClaimPixKey.unexpectedError,
    );

    const body: CreatePortabilityClaimPspRequest = {
      key: faker.datatype.uuid(),
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.fullName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: new Date(),
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPortabilityClaim(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
