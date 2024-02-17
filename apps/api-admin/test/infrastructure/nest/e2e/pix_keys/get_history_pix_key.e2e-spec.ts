import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { PixKeyHistoryModel } from '@zro/pix-keys/infrastructure';
import { KeyState } from '@zro/pix-keys/domain';
import { PixKeyHistoryFactory } from '@zro/test/pix-keys/config';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';

const mockAxios: any = axios;

jest.mock('axios');
jest.setTimeout(30000);

describe('PixController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    mockAxios.post
      .mockImplementationOnce(MockTopazioAuthentication.oAuthCode)
      .mockImplementationOnce(MockTopazioAuthentication.oAuthToken);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, PixKeysAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('pix/keys/history?page=1&size=20 (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token } = await createUserAndToken(tokenProvider);
      const pixKeyHistory =
        await PixKeyHistoryFactory.create<PixKeyHistoryModel>(
          PixKeyHistoryModel.name,
          {},
        );

      const res = await request(app.getHttpServer())
        .get(`/pix/keys/history?page=1&size=20`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.data).toBeDefined();
      expect(res.body.data.data.id).toBe(pixKeyHistory.id);
      expect(res.body.data.data.pix_key_id).toBe(pixKeyHistory.pixKeyId);
      expect(res.body.data.data.state).toBe(KeyState.PENDING);
      expect(res.body.data.data.created_at).toBe(
        pixKeyHistory.createdAt.toISOString(),
      );
    });

    it('TC0002 - Should get null with pixkey not found', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get(`/pix/keys/history`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data.data).toMatchObject([]);
    });

    it('TC0003 - Should fail with invalid id', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get(`/pix/keys/history`)
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
