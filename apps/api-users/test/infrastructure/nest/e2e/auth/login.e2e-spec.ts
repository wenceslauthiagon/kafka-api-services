import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ExceptionTypes } from '@zro/common';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { UserModel } from '@zro/users/infrastructure';
import { UserFactory } from '@zro/test/users/config';
import { initAppE2E } from '@zro/test/api-users/utils';
import {
  AuthenticateRestRequest,
  AuthenticateRestResponse,
} from '@zro/api-users/infrastructure';

jest.setTimeout(30000);

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [OperationsAppModule, UsersAppModule, ApiUsersAppModule],
    }).compile();

    app = await initAppE2E(module);
  });

  describe('With valid parameters', () => {
    it('TC0001 - Should return OK', async () => {
      const user = await UserFactory.create<UserModel>(UserModel.name);

      const body: AuthenticateRestRequest = {
        recaptcha_key: 'recaptcha-app-key',
        recaptcha_token: 'action-token',
        recaptcha_action: 'action-name',
        phone_number: `+${user.phoneNumber}`,
        password: '1234',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(body);

      const data: AuthenticateRestResponse = res.body.data;

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(data?.access_token).toBeDefined();
    });
  });

  describe('With invalid parameters', () => {
    it('TC0004 - Should return UNAUTHORIZED with invalid password', async () => {
      const user = await UserFactory.create<UserModel>(UserModel.name);

      const body: AuthenticateRestRequest = {
        recaptcha_key: 'recaptcha-app-key',
        recaptcha_token: 'action-token',
        recaptcha_action: 'action-name',
        phone_number: `+${user.phoneNumber}`,
        password: 'invalidPassword',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(body);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
      });
    });

    it('TC0005 - Should return UNPROCESSABLE_ENTITY with invalid phone number', async () => {
      const body: AuthenticateRestRequest = {
        recaptcha_key: 'recaptcha-app-key',
        recaptcha_token: 'action-token',
        recaptcha_action: 'action-name',
        phone_number: `invalidPhoneNumber`,
        password: '1234',
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(body);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
      });
    });

    it('TC0006 - Should return UNPROCESSABLE_ENTITY with invalid password format', async () => {
      const user = await UserFactory.create<UserModel>(UserModel.name);

      const body = {
        recaptcha_key: 'recaptcha-app-key',
        recaptcha_token: 'action-token',
        recaptcha_action: 'action-name',
        phone_number: `+${user.phoneNumber}`,
        password: true,
      };

      const res = await request(app.getHttpServer())
        .post('/auth/signin')
        .send(body);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
