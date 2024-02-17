import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as PixKeysAppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { DecodedQrCodeState, PaymentState } from '@zro/pix-payments/domain';
import { DecodedQrCodeFactory } from '@zro/test/pix-payments/config';
import { AddressFactory, OnboardingFactory } from '@zro/test/users/config';
import { AddressModel, OnboardingModel } from '@zro/users/infrastructure';
import { OnboardingStatus } from '@zro/users/domain';
import { DecodedQrCodeModel } from '@zro/pix-payments/infrastructure';
import {
  WalletAccountFactory,
  WalletFactory,
} from '@zro/test/operations/config';
import {
  WalletAccountModel,
  WalletModel,
} from '@zro/operations/infrastructure';
import { WalletAccountState, WalletState } from '@zro/operations/domain';

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

  describe('/pix/payments/by-qr-code/static/withdrawal (POST)', () => {
    it('TC0001 - Should post successfully Payment PENDING', async () => {
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
      const decodedQrCode =
        await DecodedQrCodeFactory.create<DecodedQrCodeModel>(
          DecodedQrCodeModel.name,
          {
            state: DecodedQrCodeState.READY,
            recipientBankIspb: '1',
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

      const res = await request(app.getHttpServer())
        .post('/pix/payments/by-qr-code/static/withdrawal')
        .send({
          pin: 1234,
          value: null,
          description: null,
          decodedQrCodeId: decodedQrCode.id,
        })
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
  });

  afterAll(async () => {
    await app.close();
  });
});
