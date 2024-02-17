import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import * as MockTopazioCreateQrCodeStatic from '@zro/test/topazio/mocks/create_qr_code_static.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { QrCodeStaticFactory } from '@zro/test/pix-payments/config';
import { QrCodeStaticModel } from '@zro/pix-payments/infrastructure';

const mockAxios: any = axios;

jest.mock('axios');
jest.setTimeout(30000);

mockAxios.create.mockImplementation(() => mockAxios);

describe('PixPaymentController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    mockAxios.post
      .mockImplementationOnce(MockTopazioAuthentication.oAuthCode)
      .mockImplementationOnce(MockTopazioAuthentication.oAuthToken);

    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiUsersAppModule, UsersAppModule, PixPaymentsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/pix/deposits/qr-codes (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      mockAxios.post.mockImplementationOnce(
        MockTopazioCreateQrCodeStatic.success,
      );

      const { token, user } = await createUserAndToken(tokenProvider);
      await QrCodeStaticFactory.createMany<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        3,
        { userId: user.uuid },
      );

      const res = await request(app.getHttpServer())
        .get('/pix/deposits/qr-codes')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.page_size).toBeDefined();
      expect(res.body.data.total).toBeDefined();
      expect(res.body.data.page_total).toBe(
        Math.ceil(res.body.data.total / res.body.data.page_size),
      );
      res.body.data.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.created_at).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
