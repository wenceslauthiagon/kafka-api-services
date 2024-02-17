import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as PixPaymentsAppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import {
  AccessTokenProvider,
  CreatePixDevolutionBody,
} from '@zro/api-users/infrastructure';
import * as MockTopazioAuthentication from '@zro/test/topazio/mocks/auth.mock';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { PixDevolutionState } from '@zro/pix-payments/domain';
import { PixDepositModel } from '@zro/pix-payments/infrastructure';
import { PixDepositFactory } from '@zro/test/pix-payments/config';

const mockAxios: any = axios;

jest.mock('axios');
jest.setTimeout(30000);

mockAxios.create.mockImplementation(() => mockAxios);

describe('PixDevolutionlController (e2e)', () => {
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

  describe('/pix/devolutions (POST)', () => {
    it('TC0001 - Should post successfully', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { userId: user.uuid },
      );
      const payload: CreatePixDevolutionBody = {
        operation_id: deposit.operationId,
        pin: '1234',
        amount: deposit.amount,
        description: 'Deposit devolution',
      };
      const res = await request(app.getHttpServer())
        .post('/pix/devolutions')
        .send(payload)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.amount).toBe(payload.amount);
      expect(res.body.data.description).toBe(payload.description);
      expect(res.body.data.state).toBe(PixDevolutionState.PENDING);
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should post with html sanitize', async () => {
      const { token, user } = await createUserAndToken(tokenProvider);
      const deposit = await PixDepositFactory.create<PixDepositModel>(
        PixDepositModel.name,
        { userId: user.uuid },
      );
      const payload: CreatePixDevolutionBody = {
        operation_id: deposit.operationId,
        pin: '1234',
        amount: deposit.amount,
        description: 'Deposit devolution.<script>log<script>',
      };
      const res = await request(app.getHttpServer())
        .post('/pix/devolutions')
        .send(payload)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.amount).toBe(payload.amount);
      expect(res.body.data.description).toBe('Deposit devolution.');
      expect(res.body.data.state).toBe(PixDevolutionState.PENDING);
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0003 - Should fail without pin', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/pix/devolutions')
        .send({ operation_id: uuidV4(), amount: 123 })
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
        .post('/pix/devolutions')
        .send({ pin: 'x', operation_id: uuidV4(), amount: 123 })
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
        .post('/pix/devolutions')
        .send({ pin: 'zzzz', operation_id: uuidV4(), amount: 123 })
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
        .post('/pix/devolutions')
        .send({ pin: '1234', operation_id: uuidV4(), amount: -123 })
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
