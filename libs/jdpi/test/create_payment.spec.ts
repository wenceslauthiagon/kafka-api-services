import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PersonType } from '@zro/users/domain';
import {
  AccountType,
  PaymentPriorityType,
  PaymentType,
  PixAgentMod,
} from '@zro/pix-payments/domain';
import {
  OfflinePixPaymentPspException,
  CreatePaymentPixPaymentPspRequest,
  PixPaymentPspException,
} from '@zro/pix-payments/application';
import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
  JdpiAgentModalityTypeException,
  JdpiFinalityTypeException,
  JdpiPersonTypeException,
  JdpiPaymentPriorityTypeException,
} from '@zro/jdpi';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCreatePayment from './mocks/create_payment.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createPayment', () => {
  let module: TestingModule;
  let pixService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixService = module.get(JdpiPixService);
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
    jest.resetAllMocks();
    JdpiAuthGateway.clearTokens();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should send payment successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePayment.success);

    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: PaymentType.KEY,
      priorityType: PaymentPriorityType.PRIORITY,
      agentMod: PixAgentMod.AGPSS,
    };

    const result = await pixService.getPixPaymentGateway().createPayment(body);

    expect(result).toBeDefined();
    expect(result.externalId).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should send createPayment after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreatePayment.offline);

    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: PaymentType.KEY,
      priorityType: PaymentPriorityType.PRIORITY,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPayment(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should send createPayment after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreatePayment.unexpectedError,
    );

    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: PaymentType.KEY,
      priorityType: PaymentPriorityType.PRIORITY,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPayment(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0004 - Should not send payment with invalid agent modality type', async () => {
    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: PaymentType.QR_CODE_STATIC_WITHDRAWAL,
      agentMod: faker.random.word() as any,
      priorityType: PaymentPriorityType.PRIORITY,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPayment(body);

    await expect(testScript).rejects.toThrow(JdpiAgentModalityTypeException);

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0005 - Should not send payment with invalid payment type', async () => {
    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: faker.random.word() as any,
      priorityType: PaymentPriorityType.PRIORITY,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPayment(body);

    await expect(testScript).rejects.toThrow(JdpiFinalityTypeException);

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0006 - Should not send payment with invalid person type', async () => {
    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: faker.random.word() as any,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: PaymentType.KEY,
      priorityType: PaymentPriorityType.PRIORITY,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPayment(body);

    await expect(testScript).rejects.toThrow(JdpiPersonTypeException);

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  it('TC0007 - Should not send payment with invalid priority type', async () => {
    const body: CreatePaymentPixPaymentPspRequest = {
      paymentId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      description: faker.name.firstName(),
      ownerBranch: faker.datatype.number(9999).toString().padStart(4, '0'),
      ownerAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      ownerName: faker.name.firstName(),
      ownerPersonType: PersonType.NATURAL_PERSON,
      ownerDocument: faker.datatype.number(99999).toString(),
      beneficiaryBankIspb: faker.datatype.number(99999).toString(),
      beneficiaryKey: faker.datatype.uuid(),
      beneficiaryBranch: faker.datatype
        .number(9999)
        .toString()
        .padStart(4, '0'),
      beneficiaryAccountType: AccountType.SLRY,
      beneficiaryAccountNumber: faker.datatype
        .number(99999)
        .toString()
        .padStart(8, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: faker.random.word() as any,
      beneficiaryDocument: faker.datatype.number(99999).toString(),
      createdAt: faker.datatype.datetime(),
      ispb: faker.random.word(),
      paymentType: PaymentType.KEY,
      priorityType: faker.random.word() as any,
    };

    const testScript = () =>
      pixService.getPixPaymentGateway().createPayment(body);

    await expect(testScript).rejects.toThrow(JdpiPaymentPriorityTypeException);

    expect(mockAxios.post).toHaveBeenCalledTimes(0);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
