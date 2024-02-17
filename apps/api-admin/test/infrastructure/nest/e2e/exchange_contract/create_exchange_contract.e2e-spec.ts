import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as OtcAppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { RemittanceFactory } from '@zro/test/otc/config';
import { RemittanceModel } from '@zro/otc/infrastructure';
import { RemittanceStatus } from '@zro/otc/domain';

jest.setTimeout(30000);

describe('CreateExchangeContractRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, OtcAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/otc/exchange-contracts (POST)', () => {
    it('TC0001 - Should post successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const remittance = await RemittanceFactory.create<RemittanceModel>(
        RemittanceModel.name,
        { status: RemittanceStatus.CLOSED },
      );

      const createParams = {
        remittances_ids: [remittance.id],
      };

      const res = await request(app.getHttpServer())
        .post('/otc/exchange_contract')
        .send(createParams)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data.id).toBe(remittance.id);
    });

    it('TC0002 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .post('/otc/exchange_contract')
        .set('Authorization', 'token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Acesso não autorizado.',
      });
    });

    it('TC0003 - Should fail when missing remittances_ids', async () => {
      const createParams = { pin: 1234 };

      const res = await request(app.getHttpServer())
        .post('/otc/exchange_contract')
        .send(createParams)
        .set('Authorization', 'token');

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0004 - Should fail when remittances_ids not are uuid', async () => {
      const createParams = {
        pin: 1234,
        remittances_ids: ['asuas'],
      };

      const res = await request(app.getHttpServer())
        .post('/otc/exchange_contract')
        .send(createParams)
        .set('Authorization', 'token');

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
