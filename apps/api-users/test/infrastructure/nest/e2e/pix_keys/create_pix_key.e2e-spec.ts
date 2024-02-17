import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { OnboardingModel } from '@zro/users/infrastructure';
import { OnboardingStatus } from '@zro/users/domain';
import { KeyState, KeyType } from '@zro/pix-keys/domain';
import { OnboardingFactory } from '@zro/test/users/config';
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

  describe('/pix/keys (POST)', () => {
    it('TC0001 - Should post successfully', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      await OnboardingFactory.create<OnboardingModel>(OnboardingModel.name, {
        status: OnboardingStatus.FINISHED,
        userId: user.id,
      });

      const res = await request(app.getHttpServer())
        .post('/pix/keys')
        .send({ type: KeyType.EVP })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.key).toBeNull();
      expect(res.body.data.type).toBe(KeyType.EVP);
      expect(res.body.data.state).toBe(KeyState.CONFIRMED);
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should fail with invalid type', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/keys')
        .send({ type: 'x' })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0003 - Should fail with cnpj type', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/keys')
        .send({ type: KeyType.CNPJ })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Por favor, tente novamente.',
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
