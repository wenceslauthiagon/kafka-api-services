import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import * as MockTopazioDeleteQrCodeStatic from '@zro/test/topazio/mocks/delete_qr_code_static.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { QrCodeStaticState } from '@zro/pix-payments/domain';
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

  describe('/pix/deposits/qr-codes/id (DELETE)', () => {
    it('TC0001 - Should delete successfully', async () => {
      mockAxios.delete.mockImplementationOnce(
        MockTopazioDeleteQrCodeStatic.success,
      );

      const { token, user } = await createUserAndToken(tokenProvider);

      const qrCodeStatic = await QrCodeStaticFactory.create<QrCodeStaticModel>(
        QrCodeStaticModel.name,
        { userId: user.uuid, state: QrCodeStaticState.READY },
      );

      const res = await request(app.getHttpServer())
        .delete(`/pix/deposits/qr-codes/${qrCodeStatic.id}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
    });

    it('TC0002 - Should fail with invalid type', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .delete('/pix/deposits/qr-codes/x')
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
