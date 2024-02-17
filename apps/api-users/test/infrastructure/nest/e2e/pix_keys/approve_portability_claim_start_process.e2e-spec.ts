import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { PixKeyModel } from '@zro/pix-keys/infrastructure';
import { KeyState } from '@zro/pix-keys/domain';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
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

  describe('/pix/keys/id/portabilities/start (POST)', () => {
    it('TC0001 - Should start portability process successfully', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        userId: user.uuid,
        state: KeyState.PORTABILITY_PENDING,
      });

      const res = await request(app.getHttpServer())
        .post(`/pix/keys/${pixKey.id}/portabilities/start`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(pixKey.id);
      expect(res.body.data.key).toBe(pixKey.key);
      expect(res.body.data.type).toBe(pixKey.type);
      expect(res.body.data.state).toBe(KeyState.PORTABILITY_OPENED);
      expect(res.body.data.created_at).toBe(pixKey.createdAt.toISOString());
    });

    it('TC0002 - Should fail with invalid id', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/keys/x/portabilities/start')
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
