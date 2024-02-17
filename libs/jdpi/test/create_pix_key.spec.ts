import axios from 'axios';
import { cnpj, cpf } from 'cpf-cnpj-validator';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KeyType, PixKeyReasonType } from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';
import {
  CreatePixKeyPspRequest,
  PixKeyOwnedBySamePersonPspException,
  PixKeyOwnedByThirdPersonPspException,
  PixKeyPspException,
  MaxNumberOfPixKeysReachedPixKeyPspException,
  PixKeyLockedByClaimPspException,
  PixKeyDuplicatePspException,
  InvalidDataFormatPixKeyPspException,
  OfflinePixKeyPspException,
} from '@zro/pix-keys/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCreatePixKey from './mocks/create_pix_key.mock';

const mockAxios: any = axios;

jest.mock('axios');
mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createPixKey', () => {
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

  it('TC0001 - Should send createPixKey successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.success);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const result = await pixKeyService.getPixKeyGateway().createPixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send createPixKey with claim response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.thirdParty);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(
      PixKeyOwnedByThirdPersonPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send createPixKey with portability response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.portability);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(
      PixKeyOwnedBySamePersonPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0004 - Should send createPixKey with locked entry', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePixKey.lockedKeyByClaim,
    );

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(PixKeyLockedByClaimPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0005 - Should send createPixKey if max number of Pix keys reached', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePixKey.maxNumOfKeysReached,
    );

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(
      MaxNumberOfPixKeysReachedPixKeyPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0006 - Should send createPixKey cpf with key', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.success);

    const document = cpf.generate();
    const body: CreatePixKeyPspRequest = {
      key: document,
      document,
      keyType: KeyType.CPF,
      personType: PersonType.NATURAL_PERSON,
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const result = await pixKeyService.getPixKeyGateway().createPixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(body.key);
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0007 - Should send createPixKey cnpj with key', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.success);

    const document = cnpj.generate();
    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.CNPJ,
      personType: PersonType.NATURAL_PERSON,
      key: document,
      document,
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const result = await pixKeyService.getPixKeyGateway().createPixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(body.key);
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0008 - Should send createPixKey email with key', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.success);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EMAIL,
      key: faker.internet.email(),
      personType: PersonType.NATURAL_PERSON,
      document: cnpj.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const result = await pixKeyService.getPixKeyGateway().createPixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(body.key.toLowerCase());
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0009 - Should send createPixKey phone with key', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.success);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.PHONE,
      key: faker.phone.number(),
      personType: PersonType.NATURAL_PERSON,
      document: cnpj.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const result = await pixKeyService.getPixKeyGateway().createPixKey(body);

    expect(result).toBeDefined();
    expect(result.key).toBe(`+${body.key.replace(/[^0-9]/g, '')}`);
    expect(result.keyType).toBe(body.keyType);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0010 - Should send createPixKey if key already exists', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.alreadyExists);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(PixKeyDuplicatePspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0011 - Should send createPixKey if key value is invalid', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.entryInvalid);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(
      InvalidDataFormatPixKeyPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0012 - Should send createPixKey after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.offline);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(OfflinePixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0013 - Should send createPixKey after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePixKey.unexpectedError);

    const body: CreatePixKeyPspRequest = {
      keyType: KeyType.EVP,
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      name: faker.name.firstName(),
      branch: faker.datatype.number(9999).toString().padStart(4, '0'),
      accountNumber: faker.datatype.number(99999).toString().padStart(8, '0'),
      accountOpeningDate: faker.date.recent(999),
      reason: PixKeyReasonType.USER_REQUESTED,
      accountType: AccountType.CACC,
      ispb: faker.random.word(),
      pixKeyId: faker.datatype.uuid(),
    };

    const testScript = () =>
      pixKeyService.getPixKeyGateway().createPixKey(body);

    await expect(testScript).rejects.toThrow(PixKeyPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
