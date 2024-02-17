import axios from 'axios';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import {
  PixDepositFactory,
  PixDevolutionFactory,
} from '@zro/test/pix-payments/config';
import {
  PixDepositModel,
  PixDevolutionModel,
} from '@zro/pix-payments/infrastructure';

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

  describe('/pix/devolutions/:id (GET)', () => {
    it('TC0001 - Should get successfully', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { userId: user.uuid },
      );
      const devolution = await PixDevolutionFactory.create<PixDevolutionModel>(
        PixDevolutionModel.name,
        { userId: user.uuid, depositId: deposit.id },
      );

      const res = await request(app.getHttpServer())
        .get(`/pix/devolutions/${devolution.id}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data.id).toBe(devolution.id);
      expect(res.body.data.state).toBe(devolution.state);
      expect(res.body.data.amount).toBe(devolution.amount);
      expect(res.body.data.description).toBe(devolution.description);
      expect(res.body.data.created_at).toBeDefined();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
