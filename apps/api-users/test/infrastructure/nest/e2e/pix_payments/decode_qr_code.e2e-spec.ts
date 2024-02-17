import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';

import { ExceptionTypes } from '@zro/common';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import * as MockTopazioCreateDecodedQrCode from '@zro/test/topazio/mocks/decode_qr_code.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { DecodedQrCodeState } from '@zro/pix-payments/domain';

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

  describe('/pix/payments/decode (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      mockAxios.get.mockImplementationOnce(
        MockTopazioCreateDecodedQrCode.success,
      );

      const emv = uuidV4();

      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .get(`pix/payments/decode?emv=${emv}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.state).toBe(DecodedQrCodeState.PENDING);
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0003 - Should fail with invalid type', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const emv = 22;

      const res = await request(app.getHttpServer())
        .get(`pix/payments/decode?emv=${emv}`)
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
