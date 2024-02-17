import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AdminModel } from '@zro/admin/infrastructure';
import { AdminFactory } from '@zro/test/admin/config';
import { initAppE2E } from '@zro/test/api-admin/utils';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule],
    }).compile();

    app = await initAppE2E(module);
  });

  describe('With valid parameters', () => {
    it('TC0001 - /auth/login (POST)', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: admin.email,
        password: '1234',
      });

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.accessToken).toBeDefined();
    });
  });

  describe('With invalid parameters', () => {
    it('TC0002 - /auth/login (POST) with invalid credentials', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: admin.email,
        password: 'x',
      });

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Por favor, tente novamente.',
      });
    });

    it('TC0003 - /auth/login (POST) with invalid password type', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: admin.email,
        password: true,
      });

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0004 - /auth/login (POST) with empty email', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: null,
        password: '',
      });

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Acesso não autorizado.',
      });
    });

    it('TC0005 - /auth/login (POST) with empty password', async () => {
      const admin = await AdminFactory.create<AdminModel>(AdminModel.name);

      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: admin.email,
        password: '',
      });

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
