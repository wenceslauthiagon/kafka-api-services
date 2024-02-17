import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as PaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';

const mockAxios: any = axios;

jest.mock('axios');
jest.setTimeout(30000);

describe('PixPaymentController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    mockAxios.post
      .mockImplementationOnce(MockTopazioAuthentication.oAuthCode)
      .mockImplementationOnce(MockTopazioAuthentication.oAuthToken);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, PaymentsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/pix/payments (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/pix/payments')
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
        expect(res.state).toBeDefined();
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0002 - Should get successfully with pagination', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const pageSize = 5;
      const res = await request(app.getHttpServer())
        .get(`/pix/payments?size=${pageSize}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.page_size).toBe(pageSize);
      expect(res.body.data.total).toBeDefined();
      expect(res.body.data.page_total).toBe(
        Math.ceil(res.body.data.total / res.body.data.page_size),
      );
      res.body.data.data.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.state).toBeDefined();
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0003 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/pix/payments')
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
