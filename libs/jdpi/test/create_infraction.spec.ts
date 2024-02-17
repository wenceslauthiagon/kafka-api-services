import { cpf } from 'cpf-cnpj-validator';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

import {
  JdpiPixModule,
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixService,
} from '@zro/jdpi';
import { getMoment } from '@zro/common';
import {
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  CreateInfractionPixInfractionPspRequest,
} from '@zro/pix-payments/application';
import {
  PixInfractionReport,
  PixInfractionType,
} from '@zro/pix-payments/domain';
import { PersonType } from '@zro/users/domain';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiCreateInfraction from './mocks/create_infraction.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway createInfraction', () => {
  let module: TestingModule;
  let pixPaymentService: JdpiPixService;
  let configService: ConfigService<JdpiGatewayConfig>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.jdpi.env'] }),
        JdpiPixModule,
      ],
    }).compile();

    pixPaymentService = module.get(JdpiPixService);
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

  it('TC0001 - Should create infraction successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreateInfraction.success);

    const body: CreateInfractionPixInfractionPspRequest = {
      operationTransactionId: faker.datatype.uuid(),
      operationTransactionEndToEndId: faker.datatype.string(),
      infractionType: PixInfractionType.REFUND_REQUEST,
      reportDetails: faker.datatype.string(),
      ispb: faker.datatype.string(),
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      ispbDebitedParticipant: faker.datatype.string(),
      ispbCreditedParticipant: faker.datatype.string(),
      reportBy: PixInfractionReport.CREDITED_PARTICIPANT,
      createdAt: getMoment().toDate(),
      branch: faker.datatype.string(),
      accountNumber: faker.datatype.string(),
    };

    const result = await pixPaymentService
      .getPixInfractionGateway()
      .createInfraction(body);

    expect(result).toBeDefined();
    expect(result.infractionId).toBeDefined();
    expect(result.infractionType).toBeDefined();
    expect(result.operationTransactionId).toBeDefined();
    expect(result.reportDetails).toBeDefined();
    expect(result.creditedParticipant).toBeDefined();
    expect(result.debitedParticipant).toBeDefined();
    expect(result.reportedBy).toBeDefined();
    expect(result.status).toBeDefined();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should not create infraction after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiCreateInfraction.offline);

    const body: CreateInfractionPixInfractionPspRequest = {
      operationTransactionId: faker.datatype.uuid(),
      operationTransactionEndToEndId: faker.datatype.string(),
      infractionType: PixInfractionType.REFUND_REQUEST,
      reportDetails: faker.datatype.string(),
      ispb: faker.datatype.string(),
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      ispbDebitedParticipant: faker.datatype.string(),
      ispbCreditedParticipant: faker.datatype.string(),
      reportBy: PixInfractionReport.CREDITED_PARTICIPANT,
      createdAt: getMoment().toDate(),
      branch: faker.datatype.string(),
      accountNumber: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixInfractionGateway().createInfraction(body);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);
    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should not create infraction after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiCreateInfraction.unexpectedError,
    );

    const body: CreateInfractionPixInfractionPspRequest = {
      operationTransactionId: faker.datatype.uuid(),
      operationTransactionEndToEndId: faker.datatype.string(),
      infractionType: PixInfractionType.REFUND_REQUEST,
      reportDetails: faker.datatype.string(),
      ispb: faker.datatype.string(),
      personType: PersonType.NATURAL_PERSON,
      document: cpf.generate(),
      ispbDebitedParticipant: faker.datatype.string(),
      ispbCreditedParticipant: faker.datatype.string(),
      reportBy: PixInfractionReport.CREDITED_PARTICIPANT,
      createdAt: getMoment().toDate(),
      branch: faker.datatype.string(),
      accountNumber: faker.datatype.string(),
    };

    const testScript = () =>
      pixPaymentService.getPixInfractionGateway().createInfraction(body);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
