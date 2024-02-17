import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { cpfMask } from '@zro/common';
import { PersonDocumentType, PersonType } from '@zro/users/domain';
import {
  GatewayWebhookException,
  WebhookTargetGatewayDepositReceivedRequest,
  WebhookTargetGatewayPaymentRequest,
  WebhookTargetGatewayPixDevolutionCompletedRequest,
  WebhookTargetGatewayPixDevolutionReceivedRequest,
} from '@zro/webhooks/application';
import {
  AxiosWebhookTargetGatewayService,
  AxiosWebhookTargetGatewayModule,
} from '@zro/gateway-webhook';
import * as MockSendWebhookClient from './mocks/send_webhook_client.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('WebhookTargetGateway', () => {
  let module: TestingModule;
  let axiosWebhookTargetService: AxiosWebhookTargetGatewayService;
  const KEY = faker.datatype.string(10);
  const URL = faker.internet.url();

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AxiosWebhookTargetGatewayModule],
    }).compile();

    axiosWebhookTargetService = module.get(AxiosWebhookTargetGatewayService);
  });

  beforeEach(() => {
    mockAxios.post.mockReset();
  });

  it('TC0001 - Should send PaymentCompleted successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.success);

    const body: WebhookTargetGatewayPaymentRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      ownerFullName: faker.name.firstName(),
      ownerPersonType: PersonType.LEGAL_PERSON,
      ownerDocument: cnpj.generate(),
      ownerAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      ownerBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: cpf.generate(),
      beneficiaryBankName: faker.company.name(),
      beneficiaryBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const result = await axiosWebhookTargetService
      .getWebhookTargetGateway()
      .sendPaymentCompleted(URL, KEY, body);

    expect(result).toBeDefined();
    expect(mockAxios.post).toBeCalledWith(
      URL,
      expect.objectContaining({
        beneficiary_document: cpfMask(body.beneficiaryDocument),
        owner_document: body.ownerDocument,
      }),
      expect.anything(),
    );
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0002 - Should send PaymentCompleted after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.offline);

    const body: WebhookTargetGatewayPaymentRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      value: faker.datatype.number({ min: 1, max: 99999 }),
      ownerFullName: faker.name.firstName(),
      ownerPersonType: PersonType.LEGAL_PERSON,
      ownerDocument: cnpj.generate(),
      ownerAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      ownerBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      beneficiaryName: faker.name.firstName(),
      beneficiaryPersonType: PersonType.NATURAL_PERSON,
      beneficiaryDocument: cpf.generate(),
      beneficiaryBankName: faker.company.name(),
      beneficiaryBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const testScript = () =>
      axiosWebhookTargetService
        .getWebhookTargetGateway()
        .sendPaymentCompleted(URL, KEY, body);

    await expect(testScript).rejects.toThrow(GatewayWebhookException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0003 - Should send sendDevolutionReceived successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.success);

    const body: WebhookTargetGatewayPixDevolutionReceivedRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      thirdPartName: faker.name.firstName(),
      thirdPartPersonType: PersonDocumentType.CNPJ,
      thirdPartDocument: cnpj.generate(),
      thirdPartBankName: faker.company.name(),
      thirdPartBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      clientName: faker.name.firstName(),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientBankName: faker.company.name(),
      clientBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const result = await axiosWebhookTargetService
      .getWebhookTargetGateway()
      .sendDevolutionReceived(URL, KEY, body);

    expect(result).toBeDefined();
    expect(mockAxios.post).toBeCalledWith(
      URL,
      expect.objectContaining({
        beneficiary_document: cpfMask(body.clientDocument),
        owner_document: body.thirdPartDocument,
      }),
      expect.anything(),
    );
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0004 - Should send sendDevolutionReceived after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.offline);

    const body: WebhookTargetGatewayPixDevolutionReceivedRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      thirdPartName: faker.name.firstName(),
      thirdPartPersonType: PersonDocumentType.CNPJ,
      thirdPartDocument: cnpj.generate(),
      thirdPartBankName: faker.company.name(),
      thirdPartBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      clientName: faker.name.firstName(),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientBankName: faker.company.name(),
      clientBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const testScript = () =>
      axiosWebhookTargetService
        .getWebhookTargetGateway()
        .sendDevolutionReceived(URL, KEY, body);

    await expect(testScript).rejects.toThrow(GatewayWebhookException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0005 - Should send sendDepositReceived successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.success);

    const body: WebhookTargetGatewayDepositReceivedRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      thirdPartName: faker.name.firstName(),
      thirdPartPersonType: PersonDocumentType.CNPJ,
      thirdPartDocument: cnpj.generate(),
      thirdPartBankName: faker.company.name(),
      thirdPartBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      clientName: faker.name.firstName(),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientBankName: faker.company.name(),
      clientBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const result = await axiosWebhookTargetService
      .getWebhookTargetGateway()
      .sendDepositReceived(URL, KEY, body);

    expect(result).toBeDefined();
    expect(mockAxios.post).toBeCalledWith(
      URL,
      expect.objectContaining({
        beneficiary_document: cpfMask(body.clientDocument),
        owner_document: body.thirdPartDocument,
      }),
      expect.anything(),
    );
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0006 - Should send sendDepositReceived after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.offline);

    const body: WebhookTargetGatewayDepositReceivedRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      thirdPartName: faker.name.firstName(),
      thirdPartPersonType: PersonDocumentType.CNPJ,
      thirdPartDocument: cnpj.generate(),
      thirdPartBankName: faker.company.name(),
      thirdPartBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      thirdPartBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      clientAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      clientName: faker.name.firstName(),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientBankName: faker.company.name(),
      clientBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const testScript = () =>
      axiosWebhookTargetService
        .getWebhookTargetGateway()
        .sendDepositReceived(URL, KEY, body);

    await expect(testScript).rejects.toThrow(GatewayWebhookException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0007 - Should send sendDevolutionCompleted successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.success);

    const body: WebhookTargetGatewayPixDevolutionCompletedRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      thirdPartName: faker.name.firstName(),
      thirdPartPersonType: PersonDocumentType.CNPJ,
      thirdPartDocument: cnpj.generate(),
      thirdPartBankName: faker.company.name(),
      thirdPartBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      clientAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      clientBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      clientName: faker.name.firstName(),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientBankName: faker.company.name(),
      clientBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const result = await axiosWebhookTargetService
      .getWebhookTargetGateway()
      .sendDevolutionCompleted(URL, KEY, body);

    expect(result).toBeDefined();
    expect(mockAxios.post).toBeCalledWith(
      URL,
      expect.objectContaining({
        beneficiary_document: body.thirdPartDocument,
        owner_document: cpfMask(body.clientDocument),
      }),
      expect.anything(),
    );
    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  it('TC0008 - Should send sendDevolutionCompleted after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockSendWebhookClient.offline);

    const body: WebhookTargetGatewayPixDevolutionCompletedRequest = {
      id: faker.datatype.uuid(),
      endToEndId: faker.datatype.uuid(),
      operationId: faker.datatype.uuid(),
      txId: faker.datatype.uuid(),
      amount: faker.datatype.number({ min: 1, max: 99999 }),
      thirdPartName: faker.name.firstName(),
      thirdPartPersonType: PersonDocumentType.CNPJ,
      thirdPartDocument: cnpj.generate(),
      thirdPartBankName: faker.company.name(),
      thirdPartBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      clientAccountNumber: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      clientBranch: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(4, '0'),
      clientName: faker.name.firstName(),
      clientPersonType: PersonDocumentType.CPF,
      clientDocument: cpf.generate(),
      clientBankName: faker.company.name(),
      clientBankIspb: faker.datatype
        .number({ min: 1, max: 99999 })
        .toString()
        .padStart(8, '0'),
      createdAt: faker.date.recent(),
    };

    const testScript = () =>
      axiosWebhookTargetService
        .getWebhookTargetGateway()
        .sendDevolutionCompleted(URL, KEY, body);

    await expect(testScript).rejects.toThrow(GatewayWebhookException);

    expect(mockAxios.post).toHaveBeenCalledTimes(1);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
