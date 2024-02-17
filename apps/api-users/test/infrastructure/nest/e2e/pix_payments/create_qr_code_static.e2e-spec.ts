import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { AddressModel, OnboardingModel } from '@zro/users/infrastructure';
import { OnboardingStatus } from '@zro/users/domain';
import { KeyState } from '@zro/pix-keys/domain';
import { AddressFactory, OnboardingFactory } from '@zro/test/users/config';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import * as MockTopazioCreateQrCodeStatic from '@zro/test/topazio/mocks/create_qr_code_static.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { PixKeyFactory } from '@zro/test/pix-keys/config';
import { PixKeyModel } from '@zro/pix-keys/infrastructure';
import { QrCodeStaticState } from '@zro/pix-payments/domain';

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
      imports: [
        ApiUsersAppModule,
        UsersAppModule,
        PixKeysAppModule,
        PixPaymentsAppModule,
      ],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/pix/deposits/qr-codes (POST)', () => {
    it('TC0001 - Should post successfully', async () => {
      mockAxios.post.mockImplementationOnce(
        MockTopazioCreateQrCodeStatic.success,
      );

      const { token, user } = await createUserAndToken(tokenProvider);
      const address = await AddressFactory.create<AddressModel>(
        AddressModel.name,
        {
          userId: user.id,
        },
      );
      await OnboardingFactory.create<OnboardingModel>(OnboardingModel.name, {
        status: OnboardingStatus.FINISHED,
        userId: user.id,
        addressId: address.id,
      });
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        userId: user.uuid,
        state: KeyState.READY,
      });

      const res = await request(app.getHttpServer())
        .post('/pix/deposits/qr-codes')
        .send({ key_id: pixKey.id, value: 1299 })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.emv).not.toBeDefined();
      expect(res.body.data.txid).not.toBeDefined();
      expect(res.body.data.summary).not.toBeDefined();
      expect(res.body.data.description).not.toBeDefined();
      expect(res.body.data.key_id).toBe(pixKey.id);
      expect(res.body.data.value).toBe(1299);
      expect(res.body.data.state).toBe(QrCodeStaticState.PENDING);
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should post with html sanitize', async () => {
      mockAxios.post.mockImplementationOnce(
        MockTopazioCreateQrCodeStatic.success,
      );

      const { token, user } = await createUserAndToken(tokenProvider);
      const address = await AddressFactory.create<AddressModel>(
        AddressModel.name,
        {
          userId: user.id,
        },
      );
      await OnboardingFactory.create<OnboardingModel>(OnboardingModel.name, {
        status: OnboardingStatus.FINISHED,
        userId: user.id,
        addressId: address.id,
      });
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        userId: user.uuid,
        state: KeyState.READY,
      });

      const res = await request(app.getHttpServer())
        .post('/pix/deposits/qr-codes')
        .send({
          key_id: pixKey.id,
          summary: 'party-payment 2>3',
          description: 'The party payment. <script>log<script>',
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.emv).not.toBeDefined();
      expect(res.body.data.txid).not.toBeDefined();
      expect(res.body.data.summary).toBe('party-payment 2>3');
      expect(res.body.data.description).toBe('The party payment. ');
      expect(res.body.data.key_id).toBe(pixKey.id);
      expect(res.body.data.value).not.toBeDefined();
      expect(res.body.data.state).toBe(QrCodeStaticState.PENDING);
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0003 - Should fail with invalid type', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/deposits/qr-codes')
        .send({ key_id: 'x' })
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
