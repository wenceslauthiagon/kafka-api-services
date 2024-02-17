import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';

const mockAxios: any = axios;

jest.mock('axios');
jest.setTimeout(30000);

mockAxios.create.mockImplementation(() => mockAxios);

describe('PixKeyController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    mockAxios.post
      .mockImplementationOnce(MockTopazioAuthentication.oAuthCode)
      .mockImplementationOnce(MockTopazioAuthentication.oAuthToken);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiUsersAppModule, UsersAppModule, PixKeysAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/pix/keys (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get('/pix/keys')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toMatchObject([]);
    });

    it('TC0002 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .get('/pix/keys')
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
