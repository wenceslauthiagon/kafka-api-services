import { createMock } from 'ts-auto-mock';
import { Mutex } from 'redis-semaphore';
import { method, On } from 'ts-auto-mock/extension';
import { Test, TestingModule } from '@nestjs/testing';
import { KafkaService } from '@zro/common';
import { PixKeyClaim } from '@zro/pix-keys/domain';
import {
  GetClaimPixKeyPspResponse,
  GetClaimPixKeyPspResponseItem,
  PixKeyGateway,
} from '@zro/pix-keys/application';
import { JdpiPixService } from '@zro/jdpi';
import {
  SyncGetAllPixKeyClaimCronService as Cron,
  PixKeyClaimModel,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyClaimFactory } from '@zro/test/pix-keys/config';

jest.mock('redis-semaphore');
jest.mock('ioredis');

describe('SyncGetAllPixKeyClaimCronService', () => {
  let module: TestingModule;
  let controller: Cron;

  const kafkaService: KafkaService = createMock<KafkaService>();
  const mockPixKeyGateway: PixKeyGateway = createMock<PixKeyGateway>();
  const mockGetClaimPixKey: jest.Mock = On(mockPixKeyGateway).get(
    method((mock) => mock.getClaimPixKey),
  );

  const mockJdpiService: JdpiPixService = createMock<JdpiPixService>();
  const mockGetPixKeyGateway: jest.Mock = On(mockJdpiService).get(
    method((mock) => mock.getPixKeyGateway),
  );

  const getClaim = (
    pixKeyClaim: PixKeyClaim,
  ): GetClaimPixKeyPspResponseItem => ({
    id: pixKeyClaim.id,
    type: pixKeyClaim.type,
    key: pixKeyClaim.key,
    keyType: pixKeyClaim.keyType,
    ispb: pixKeyClaim.ispb,
    branch: pixKeyClaim.branch,
    accountNumber: pixKeyClaim.accountNumber,
    personType: pixKeyClaim.personType,
    document: pixKeyClaim.document,
    status: pixKeyClaim.status,
  });

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .overrideProvider(JdpiPixService)
      .useValue(mockJdpiService)
      .compile();
    controller = module.get<Cron>(Cron);
  });

  beforeEach(async () => {
    await PixKeyClaimModel.truncate({ cascade: true });
    jest.resetAllMocks();
    jest.spyOn(Mutex.prototype, 'tryAcquire').mockResolvedValue(true);
    mockGetPixKeyGateway.mockReturnValue(mockPixKeyGateway);
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should create PixKeyClaim successfully when it is new', async () => {
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
      );
      const claim = getClaim(pixKeyClaim);

      const gatewayResponse: GetClaimPixKeyPspResponse = {
        hasMoreElements: false,
        claims: [claim],
      };

      mockGetClaimPixKey.mockResolvedValueOnce(gatewayResponse);

      await controller.execute();

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(claim.status);
      expect(mockGetClaimPixKey).toHaveBeenCalledTimes(1);
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
