import axios from 'axios';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  JdpiAuthGateway,
  JdpiAuthGatewayConfig,
  JdpiGatewayConfig,
  JdpiPixModule,
  JdpiPixService,
} from '@zro/jdpi';
import {
  DecodeQrCodePixPaymentPspRequest,
  OfflinePixPaymentPspException,
  PixPaymentPspException,
  DecodedQrCodeInvalidTypeException,
  DecodeQrCodeTimeoutPixPaymentPspException,
} from '@zro/pix-payments/application';
import * as MockJdpiAuthentication from './mocks/auth.mock';
import * as MockJdpiDecodeQrCode from './mocks/decode_qr_code.mock';

const mockAxios: any = axios;

jest.mock('axios');

mockAxios.create.mockImplementation(() => mockAxios);

describe('PspGateway decodeQrCode', () => {
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
    JdpiAuthGateway.clearTokens();
    mockAxios.post.mockReset();
    mockAxios.get.mockReset();
    mockAxios.post.mockImplementationOnce(MockJdpiAuthentication.oAuthToken);
  });

  it('TC0001 - Should post decodedQrCode successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDecodeQrCode.successStatic);

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      paymentDate: faker.datatype.datetime(),
      document: faker.datatype.string(),
      decodedQrCodeId: faker.datatype.uuid(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .decodeQrCode(params);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.documentValue).toBeDefined();
    expect(result.additionalInfo).toBeDefined();
    expect(result.recipientName).toBeDefined();
    expect(result.recipientPersonType).toBeDefined();
    expect(result.recipientDocument).toBeDefined();
    expect(result.recipientIspb).toBeDefined();
    expect(result.recipientBranch).toBeDefined();
    expect(result.recipientAccountType).toBeDefined();
    expect(result.recipientAccountNumber).toBeDefined();
    expect(result.recipientCity).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.agentModChange).toBeNull();
    expect(result.agentModWithdrawal).toBeNull();
    expect(result.allowUpdate).toBeFalsy();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0002 - Should post decodedQrCode Dynamic type QR_CODE_DYNAMIC_INSTANT_PAYMENT with allowUpdate successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDecodeQrCode.successDynamic);

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      paymentDate: faker.datatype.datetime(),
      document: faker.datatype.string(),
      decodedQrCodeId: faker.datatype.uuid(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .decodeQrCode(params);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.documentValue).toBeDefined();
    expect(result.additionalInfos).toBeDefined();
    expect(result.recipientName).toBeDefined();
    expect(result.recipientPersonType).toBeDefined();
    expect(result.recipientDocument).toBeDefined();
    expect(result.recipientIspb).toBeDefined();
    expect(result.recipientBranch).toBeDefined();
    expect(result.recipientAccountType).toBeDefined();
    expect(result.recipientAccountNumber).toBeDefined();
    expect(result.recipientCity).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.agentModChange).toBeNull();
    expect(result.agentModWithdrawal).toBeNull();
    expect(result.agentModChange).toBeDefined();
    expect(result.agentModWithdrawal).toBeDefined();
    expect(result.allowUpdate).toBeTruthy();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0003 - Should post decodedQrCode Dynamic type QR_CODE_DYNAMIC_WITHDRAWAL with allowUpdate successfully', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiDecodeQrCode.successDynamicWithdrawal,
    );

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      paymentDate: faker.datatype.datetime(),
      document: faker.datatype.string(),
      decodedQrCodeId: faker.datatype.uuid(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .decodeQrCode(params);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.documentValue).toBeDefined();
    expect(result.additionalInfos).toBeDefined();
    expect(result.recipientName).toBeDefined();
    expect(result.recipientPersonType).toBeDefined();
    expect(result.recipientDocument).toBeDefined();
    expect(result.recipientIspb).toBeDefined();
    expect(result.recipientBranch).toBeDefined();
    expect(result.recipientAccountType).toBeDefined();
    expect(result.recipientAccountNumber).toBeDefined();
    expect(result.recipientCity).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.agentModChange).toBeDefined();
    expect(result.agentModWithdrawal).toBeDefined();
    expect(result.allowUpdate).toBeTruthy();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0004 - Should post decodedQrCode Dynamic (QR_CODE_DYNAMIC_CHANGE) set NOT_ALLOW successfully', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiDecodeQrCode.successDynamicChange,
    );

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      paymentDate: faker.datatype.datetime(),
      document: faker.datatype.string(),
      decodedQrCodeId: faker.datatype.uuid(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .decodeQrCode(params);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.documentValue).toBeDefined();
    expect(result.additionalInfos).toBeDefined();
    expect(result.recipientName).toBeDefined();
    expect(result.recipientPersonType).toBeDefined();
    expect(result.recipientDocument).toBeDefined();
    expect(result.recipientIspb).toBeDefined();
    expect(result.recipientBranch).toBeDefined();
    expect(result.recipientAccountType).toBeDefined();
    expect(result.recipientAccountNumber).toBeDefined();
    expect(result.recipientCity).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.agentModChange).toBeNull();
    expect(result.agentModWithdrawal).toBeNull();
    expect(result.allowUpdate).toBeFalsy();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0005 - Should post decodedQrCode DUE DATE (QR_CODE_DYNAMIC_DUE_DATE) successfully', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDecodeQrCode.successDynamic);

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      paymentDate: faker.datatype.datetime(),
      document: faker.datatype.string(),
      decodedQrCodeId: faker.datatype.uuid(),
    };

    const result = await pixPaymentService
      .getPixPaymentGateway()
      .decodeQrCode(params);

    expect(result).toBeDefined();
    expect(result.key).toBeDefined();
    expect(result.txId).toBeDefined();
    expect(result.documentValue).toBeDefined();
    expect(result.additionalInfos).toBeDefined();
    expect(result.recipientName).toBeDefined();
    expect(result.recipientPersonType).toBeDefined();
    expect(result.recipientDocument).toBeDefined();
    expect(result.recipientIspb).toBeDefined();
    expect(result.recipientBranch).toBeDefined();
    expect(result.recipientAccountType).toBeDefined();
    expect(result.recipientAccountNumber).toBeDefined();
    expect(result.recipientCity).toBeDefined();
    expect(result.endToEndId).toBeDefined();
    expect(result.agentModChange).toBeNull();
    expect(result.agentModWithdrawal).toBeNull();

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0006 - Should post decodedQrCode after offline response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDecodeQrCode.offline);

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      decodedQrCodeId: faker.datatype.uuid(),
      document: faker.datatype.string(),
      paymentDate: faker.datatype.datetime(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().decodeQrCode(params);

    await expect(testScript).rejects.toThrow(OfflinePixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0007 - Should post decodedQrCode after unexpected error response', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDecodeQrCode.unexpectedError);

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      decodedQrCodeId: faker.datatype.uuid(),
      document: faker.datatype.string(),
      paymentDate: faker.datatype.datetime(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().decodeQrCode(params);

    await expect(testScript).rejects.toThrow(PixPaymentPspException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0008 - Should post decodedQrCode after error type qrCode', async () => {
    mockAxios.post.mockImplementationOnce(
      MockJdpiDecodeQrCode.invalidQrCodeType,
    );

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      decodedQrCodeId: faker.datatype.uuid(),
      document: faker.datatype.string(),
      paymentDate: faker.datatype.datetime(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().decodeQrCode(params);

    await expect(testScript).rejects.toThrow(DecodedQrCodeInvalidTypeException);

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  it('TC0009 - Should post decodedQrCode after timeout error', async () => {
    mockAxios.post.mockImplementationOnce(MockJdpiDecodeQrCode.timeoutError);

    const params: DecodeQrCodePixPaymentPspRequest = {
      emv: faker.datatype.uuid(),
      decodedQrCodeId: faker.datatype.uuid(),
      document: faker.datatype.string(),
      paymentDate: faker.datatype.datetime(),
    };

    const testScript = () =>
      pixPaymentService.getPixPaymentGateway().decodeQrCode(params);

    await expect(testScript).rejects.toThrow(
      DecodeQrCodeTimeoutPixPaymentPspException,
    );

    expect(mockAxios.post).toHaveBeenCalledTimes(2);
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
