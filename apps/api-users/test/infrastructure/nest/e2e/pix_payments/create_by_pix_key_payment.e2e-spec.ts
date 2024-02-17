import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import {
  AccessTokenProvider,
  PaymentByPixKeyBody,
} from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { DecodedPixKeyState } from '@zro/pix-keys/domain';
import { DecodedPixKeyFactory } from '@zro/test/pix-keys/config';
import { DecodedPixKeyModel } from '@zro/pix-keys/infrastructure';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import {
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { WalletAccountState, WalletState } from '@zro/operations/domain';
import { PaymentState } from '@zro/pix-payments/domain';
import { ExceptionTypes } from '@zro/common';

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
        OperationsAppModule,
      ],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/pix/payments/by-key/instant-billing (POST)', () => {
    it('TC0001 - Should post successfully Payment PENDING', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      const decodedPixKeyId = uuidV4();
      await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
        DecodedPixKeyModel.name,
        {
          state: DecodedPixKeyState.PENDING,
          id: decodedPixKeyId,
        },
      );
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name, {
        userId: user.id,
        state: WalletState.ACTIVE,
        userUUID: user.uuid,
      });
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        {
          currencyId: 1,
          walletId: wallet.id,
          walletUUID: wallet.uuid,
          balance: 1500000,
          state: WalletAccountState.ACTIVE,
        },
      );
      const paymentBody: PaymentByPixKeyBody = {
        decoded_pix_key_id: decodedPixKeyId,
        value: 1000,
        payment_date: null,
        description: 'Payment by pix key',
        pin: '1234',
      };

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-key/instant-billing')
        .send(paymentBody)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.operation_id).toBeDefined();
      expect(res.body.data.state).toBe(PaymentState.PENDING);
      expect(res.body.data.value).toBeDefined();
      expect(res.body.data.payment_date).toBeDefined();
      expect(res.body.data.description).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should post with html sanitize', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      const decodedPixKeyId = uuidV4();
      await DecodedPixKeyFactory.create<DecodedPixKeyModel>(
        DecodedPixKeyModel.name,
        {
          state: DecodedPixKeyState.PENDING,
          id: decodedPixKeyId,
        },
      );
      const wallet = await WalletFactory.create<WalletModel>(WalletModel.name, {
        userId: user.id,
        state: WalletState.ACTIVE,
        userUUID: user.uuid,
      });
      await WalletAccountFactory.create<WalletAccountModel>(
        WalletAccountModel.name,
        {
          currencyId: 1,
          walletId: wallet.id,
          walletUUID: wallet.uuid,
          balance: 1500000,
          state: WalletAccountState.ACTIVE,
        },
      );
      const paymentBody: PaymentByPixKeyBody = {
        decoded_pix_key_id: decodedPixKeyId,
        value: 1000,
        payment_date: null,
        description: 'Payment by pix key.<script>log<script>',
        pin: '1234',
      };

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-key/instant-billing')
        .send(paymentBody)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.operation_id).toBeDefined();
      expect(res.body.data.state).toBe(PaymentState.PENDING);
      expect(res.body.data.value).toBeDefined();
      expect(res.body.data.payment_date).toBeDefined();
      expect(res.body.data.description).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0003 - Should fail without pin', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-key/instant-billing')
        .send({ decoded_pix_key_id: uuidV4(), value: 1000 })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Por favor, tente novamente.',
      });
    });

    it('TC0004 - Should fail with invalid pin', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-key/instant-billing')
        .send({ pin: 'x', decoded_pix_key_id: uuidV4(), value: 1000 })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0005 - Should fail with wrong pin', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-key/instant-billing')
        .send({ pin: 'zzzz', decoded_pix_key_id: uuidV4(), value: 1000 })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Por favor, tente novamente.',
      });
    });

    it('TC0006 - Should fail with negative amount', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-key/instant-billing')
        .send({ pin: '1234', decoded_pix_key_id: uuidV4(), value: -1000 })
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
