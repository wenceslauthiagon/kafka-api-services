import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as BankingAppModule } from '@zro/banking/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { BankFactory } from '@zro/test/banking/config';
import { BankModel } from '@zro/banking/infrastructure';

jest.setTimeout(30000);

describe('GetAllBankRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, BankingAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/banking/banks (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/banking/banks')
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
        expect(res.name).toBeDefined();
        expect(res.ispb).toBeDefined();
        expect(res.full_name).toBeDefined();
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0002 - Should get successfully with active', async () => {
      const { token } = await createAdminAndToken(tokenProvider);
      const active = false;
      await BankFactory.createMany<BankModel>(BankModel.name, 2, { active });

      const res = await request(app.getHttpServer())
        .get(`/banking/banks?active=${active}`)
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
        expect(res.name).toBeDefined();
        expect(res.ispb).toBeDefined();
        expect(res.active).toBe(active);
        expect(res.full_name).toBeDefined();
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0003 - Should get successfully with name', async () => {
      const { token } = await createAdminAndToken(tokenProvider);
      const bank = await BankFactory.create<BankModel>(BankModel.name);

      const res = await request(app.getHttpServer())
        .get(`/banking/banks?search=${bank.name}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.page_size).toBeDefined();
      expect(res.body.data.page_total).toBeDefined();
      expect(res.body.data.total).toBeDefined();
      res.body.data.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBe(bank.id);
        expect(res.name).toBe(bank.name);
        expect(res.active).toBe(bank.active);
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0004 - Should not get banks with different search', async () => {
      const { token } = await createAdminAndToken(tokenProvider);
      await BankFactory.create<BankModel>(BankModel.name);

      const res = await request(app.getHttpServer())
        .get(`/banking/banks?search=${Date.now()}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.page_size).toBeDefined();
      expect(res.body.data.page_total).toBe(0);
      expect(res.body.data.total).toBe(0);
      expect(res.body.data.data).toHaveLength(0);
    });

    it('TC0005 - Should fail with invalid active value', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/banking/banks?active=x')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0006 - Should fail with invalid search length', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/banking/banks?search=')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0007 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/banking/banks')
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
