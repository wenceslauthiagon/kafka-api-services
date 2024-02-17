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
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { PaymentEntity, PaymentState } from '@zro/pix-payments/domain';
import { PaymentFactory } from '@zro/test/pix-payments/config';

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

  describe('/pix/payments/by-account/instant-billing (POST)', () => {
    it('TC0001 - Should post successfully Payment PENDING', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const {
        beneficiaryAccountType,
        beneficiaryPersonType,
        beneficiaryBranch,
        beneficiaryAccountNumber,
        beneficiaryBankName,
        beneficiaryBankIspb,
        beneficiaryDocument,
        beneficiaryName,
        value,
        endToEndId,
        paymentDate,
        description,
      } = await PaymentFactory.create<PaymentEntity>(PaymentEntity.name);

      const paymentBody = new PaymentEntity({
        beneficiaryAccountType,
        beneficiaryPersonType,
        beneficiaryBranch,
        beneficiaryAccountNumber,
        beneficiaryBankName,
        beneficiaryBankIspb,
        beneficiaryDocument,
        beneficiaryName,
        value,
        endToEndId,
        paymentDate,
        description,
      });

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-account/instant-billing')
        .send({ pin: 1234, paymentBody })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.statement_id).toBeDefined();
      expect(res.body.data.state).toBe(PaymentState.PENDING);
      expect(res.body.data.person_type).toBeDefined();
      expect(res.body.data.bank_name).toBeDefined();
      expect(res.body.data.bank_code).toBeDefined();
      expect(res.body.data.document).toBeDefined();
      expect(res.body.data.name).toBeDefined();
      expect(res.body.data.value).toBeDefined();
      expect(res.body.data.payment_date).toBeDefined();
      expect(res.body.data.additional_info).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should fail with invalid type', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-account/instant-billing')
        .send({ key_id: 'x' })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
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
