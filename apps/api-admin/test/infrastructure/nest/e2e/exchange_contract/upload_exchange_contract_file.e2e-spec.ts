import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as OtcAppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { ExchangeContractFactory } from '@zro/test/otc/config';
import { ExchangeContractModel } from '@zro/otc/infrastructure';

jest.setTimeout(30000);

describe('UploadExchangeContractFileRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, OtcAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('otc/exchange-contracts/files/upload/:id (PATCH)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractModel>(
          ExchangeContractModel.name,
        );

      const res = await request(app.getHttpServer())
        .patch(`/otc/exchange-contract/${exchangeContract.id}/files/upload`)
        .send(null)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
    });

    it('TC0002 - Should fail with invalid access token', async () => {
      const exchangeContract =
        await ExchangeContractFactory.create<ExchangeContractModel>(
          ExchangeContractModel.name,
        );

      const res = await request(app.getHttpServer())
        .patch(`otc/exchange-contracts/${exchangeContract.id}/files/upload`)
        .send(null)
        .set('Authorization', 'wrong-token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Acesso não autorizado.',
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
