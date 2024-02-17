import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as BankingAppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import {
  AccessTokenProvider,
  UpdateBankBody,
} from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { BankFactory } from '@zro/test/banking/config';
import { BankModel } from '@zro/banking/infrastructure';

jest.setTimeout(30000);

describe('UpdateBankRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, BankingAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/banking/banks/:id (PATCH)', () => {
    it('TC0001 - Should patch successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const { id } = await BankFactory.create<BankModel>(BankModel.name, {
        active: false,
      });
      const active = true;

      const payload: UpdateBankBody = { active };

      const res = await request(app.getHttpServer())
        .patch(`/banking/banks/${id}`)
        .send(payload)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(id);
      expect(res.body.data.active).toBe(active);
      expect(res.body.data.ispb).toBeDefined();
      expect(res.body.data.full_name).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should fail with invalid access token', async () => {
      const payload: UpdateBankBody = { active: true };
      const res = await request(app.getHttpServer())
        .patch('/banking/banks/x')
        .send(payload)
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
