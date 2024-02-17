import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as QuotationsAppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';

jest.setTimeout(30000);

describe('SpreadRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, QuotationsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/quotations/spreads (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/quotations/spreads')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.page_size).toBeDefined();
      expect(res.body.data.page_total).toBeDefined();
      expect(res.body.data.total).toBeDefined();
      res.body.data.data.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.buy).toBeDefined();
        expect(res.sell).toBeDefined();
        expect(res.amount).toBeDefined();
        expect(res.provider_id).toBeDefined();
        expect(res.provider_tag).toBeDefined();
        expect(res.source_id).toBeDefined();
        expect(res.source_symbol).toBeDefined();
        expect(res.target_id).toBeDefined();
        expect(res.target_symbol).toBeDefined();
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0002 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/quotations/spreads')
        .set('Authorization', 'token');

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
