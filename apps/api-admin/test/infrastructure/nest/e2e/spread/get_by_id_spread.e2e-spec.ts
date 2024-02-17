import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as QuotationsAppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { SpreadModel } from '@zro/otc/infrastructure';
import { SpreadFactory } from '@zro/test/otc/config';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';

jest.setTimeout(30000);

describe('SpreadController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, QuotationsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/quotations/spreads/id (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);
      const spread = await SpreadFactory.create<SpreadModel>(SpreadModel.name);

      const res = await request(app.getHttpServer())
        .get(`/quotations/spreads/${spread.id}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(spread.id);
      expect(res.body.data.buy).toBe(spread.buy);
      expect(res.body.data.sell).toBe(spread.sell);
      expect(res.body.data.amount).toBe(spread.amount);
      expect(res.body.data.base_id).toBe(spread.currencyId);
      expect(res.body.data.base_symbol).toBe(spread.currencySymbol);
      expect(res.body.data.created_at).toBe(spread.createdAt.toISOString());
    });

    it('TC0002 - Should fail with invalid id', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/quotations/spreads/x')
        .set('Authorization', token);

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
