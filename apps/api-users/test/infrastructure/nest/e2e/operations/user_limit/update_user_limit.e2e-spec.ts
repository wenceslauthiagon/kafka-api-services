import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import {
  GlobalLimitFactory,
  LimitTypeFactory,
} from '@zro/test/operations/config';
import {
  GlobalLimitModel,
  LimitTypeModel,
} from '@zro/operations/infrastructure';

jest.setTimeout(30000);

describe('UpdateUserLimitController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiUsersAppModule, UsersAppModule, OperationsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/user/limits (PATCH)', () => {
    it('TC0001 - Should update user limit nigth interval successfully', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          night_time_start: '22:00',
          night_time_end: '06:00',
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.daily_limit).toBeDefined();
        expect(res.user_daily_limit).toBeDefined();
        expect(res.monthly_limit).toBeDefined();
        expect(res.user_monthly_limit).toBeDefined();
        expect(res.yearly_limit).toBeDefined();
        expect(res.user_yearly_limit).toBeDefined();
        expect(res.nightly_limit).toBeDefined();
        expect(res.user_nightly_limit).toBeDefined();
        expect(res.max_amount).toBeDefined();
        expect(res.min_amount).toBeDefined();
        expect(res.max_amount_nightly).toBeDefined();
        expect(res.min_amount_nightly).toBeDefined();
        expect(res.user_max_amount).toBeDefined();
        expect(res.user_min_amount).toBeDefined();
        expect(res.user_max_amount_nightly).toBeDefined();
        expect(res.user_min_amount_nightly).toBeDefined();
        expect(res.nighttime_end).toBe('06:00');
        expect(res.nighttime_start).toBe('22:00');
      });
    });

    it('TC0002 - Should fail with invalid night_time_start length', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [2],
          night_time_start: '22:00000',
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.BAD_REQUEST);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Verifique os dados e tente novamente.',
      });
    });

    it('TC0003 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .set('Authorization', 'token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Acesso não autorizado.',
      });
    });

    it('TC0004 - Should update user daily limit', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        dailyLimit: 2000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/user_limits')
        .send({
          limit_types_ids: [2],
          user_daily_limit: 1000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.daily_limit).toBeDefined();
        expect(res.user_daily_limit).toBe(1000);
        expect(res.monthly_limit).toBeDefined();
        expect(res.user_monthly_limit).toBeDefined();
        expect(res.yearly_limit).toBeDefined();
        expect(res.user_yearly_limit).toBeDefined();
        expect(res.nightly_limit).toBeDefined();
        expect(res.user_nightly_limit).toBeDefined();
        expect(res.max_amount).toBeDefined();
        expect(res.min_amount).toBeDefined();
        expect(res.max_amount_nightly).toBeDefined();
        expect(res.min_amount_nightly).toBeDefined();
        expect(res.user_max_amount).toBeDefined();
        expect(res.user_min_amount).toBeDefined();
        expect(res.user_max_amount_nightly).toBeDefined();
        expect(res.user_min_amount_nightly).toBeDefined();
        expect(res.nighttime_end).toBe('06:00');
        expect(res.nighttime_start).toBe('22:00');
      });
    });

    it('TC0005 - Should fail with user daily limit above the limit', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        dailyLimit: 2000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/user_limits')
        .send({
          limit_types_ids: [2],
          user_daily_limit: 3000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Limite diário excedido.',
      });
    });

    it('TC0006 - Should fail with user monthly limit above the limit', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        monthlyLimit: 2000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/user_limits')
        .send({
          limit_types_ids: [2],
          user_monthly_limit: 3000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Limite mensal excedido.',
      });
    });

    it('TC0007 - Should fail with user yearly limit above the limit', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        yearlyLimit: 2000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/user_limits')
        .send({
          limit_types_ids: [2],
          user_yearly_limit: 3000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Limite anual excedido.',
      });
    });

    it('TC0008 - Should fail with user nightly limit above the limit', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        nightlyLimit: 2000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/user_limits')
        .send({
          limit_types_ids: [2],
          user_nightly_limit: 3000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Limite noturno excedido.',
      });
    });

    it('TC0009 - Should update user daily limit successfully for Pix with drawal', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXWITHDRAWAL' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_daily_limit: 499,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.daily_limit).toBeDefined();
        expect(res.user_daily_limit).toBe(499);
        expect(res.monthly_limit).toBeDefined();
        expect(res.user_monthly_limit).toBeDefined();
        expect(res.yearly_limit).toBeDefined();
        expect(res.user_yearly_limit).toBeDefined();
        expect(res.nightly_limit).toBeDefined();
        expect(res.user_nightly_limit).toBe(1000);
        expect(res.max_amount).toBeDefined();
        expect(res.min_amount).toBeDefined();
        expect(res.max_amount_nightly).toBeDefined();
        expect(res.min_amount_nightly).toBeDefined();
        expect(res.user_max_amount).toBeDefined();
        expect(res.user_min_amount).toBeDefined();
        expect(res.user_max_amount_nightly).toBeDefined();
        expect(res.user_min_amount_nightly).toBeDefined();
        expect(res.nighttime_end).toBe('06:00');
        expect(res.nighttime_start).toBe('20:00');
      });
    });

    it('TC0010 - Should update user daily limit successfully for Pix change', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXCHANGE' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_daily_limit: 499,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.daily_limit).toBeDefined();
        expect(res.user_daily_limit).toBe(499);
        expect(res.monthly_limit).toBeDefined();
        expect(res.user_monthly_limit).toBeDefined();
        expect(res.yearly_limit).toBeDefined();
        expect(res.user_yearly_limit).toBeDefined();
        expect(res.nightly_limit).toBeDefined();
        expect(res.user_nightly_limit).toBe(1000);
        expect(res.max_amount).toBeDefined();
        expect(res.min_amount).toBeDefined();
        expect(res.max_amount_nightly).toBeDefined();
        expect(res.min_amount_nightly).toBeDefined();
        expect(res.user_max_amount).toBeDefined();
        expect(res.user_min_amount).toBeDefined();
        expect(res.user_max_amount_nightly).toBeDefined();
        expect(res.user_min_amount_nightly).toBeDefined();
        expect(res.nighttime_end).toBe('06:00');
        expect(res.nighttime_start).toBe('20:00');
      });
    });

    it('TC0011 - Should fail with user daily limit biggest than 500 for Pix with drawal', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXWITHDRAWAL' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_daily_limit: 501,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message:
          'Não foi possível processar o seu pedido. Por favor tente novamente.',
      });
    });

    it('TC0012 - Should fail with user daily limit biggest than 500 for Pix change', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXCHANGE' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_daily_limit: 501,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message:
          'Não foi possível processar o seu pedido. Por favor tente novamente.',
      });
    });

    it('TC0013 - Should update user nightly limit successfully for Pix with drawal', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXWITHDRAWAL' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_nightly_limit: 99,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.daily_limit).toBeDefined();
        expect(res.user_daily_limit).toBe(1000);
        expect(res.monthly_limit).toBeDefined();
        expect(res.user_monthly_limit).toBeDefined();
        expect(res.yearly_limit).toBeDefined();
        expect(res.user_yearly_limit).toBeDefined();
        expect(res.nightly_limit).toBeDefined();
        expect(res.user_nightly_limit).toBe(99);
        expect(res.max_amount).toBeDefined();
        expect(res.min_amount).toBeDefined();
        expect(res.max_amount_nightly).toBeDefined();
        expect(res.min_amount_nightly).toBeDefined();
        expect(res.user_max_amount).toBeDefined();
        expect(res.user_min_amount).toBeDefined();
        expect(res.user_max_amount_nightly).toBeDefined();
        expect(res.user_min_amount_nightly).toBeDefined();
        expect(res.nighttime_end).toBe('06:00');
        expect(res.nighttime_start).toBe('20:00');
      });
    });

    it('TC0014 - Should update user nightly limit successfully for Pix change', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXCHANGE' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_nightly_limit: 99,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.daily_limit).toBeDefined();
        expect(res.user_daily_limit).toBe(1000);
        expect(res.monthly_limit).toBeDefined();
        expect(res.user_monthly_limit).toBeDefined();
        expect(res.yearly_limit).toBeDefined();
        expect(res.user_yearly_limit).toBeDefined();
        expect(res.nightly_limit).toBeDefined();
        expect(res.user_nightly_limit).toBe(99);
        expect(res.max_amount).toBeDefined();
        expect(res.min_amount).toBeDefined();
        expect(res.max_amount_nightly).toBeDefined();
        expect(res.min_amount_nightly).toBeDefined();
        expect(res.user_max_amount).toBeDefined();
        expect(res.user_min_amount).toBeDefined();
        expect(res.user_max_amount_nightly).toBeDefined();
        expect(res.user_min_amount_nightly).toBeDefined();
        expect(res.nighttime_end).toBe('06:00');
        expect(res.nighttime_start).toBe('20:00');
      });
    });

    it('TC0015 - Should fail with user nightly limit biggest than 100 for Pix with drawal', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXWITHDRAWAL' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_nightly_limit: 101,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message:
          'Não foi possível processar o seu pedido. Por favor tente novamente.',
      });
    });

    it('TC0016 - Should fail with user nightly limit biggest than 100 for Pix change', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
        { tag: 'PIXCHANGE' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
        userDailyLimit: 1000,
        userNightlyLimit: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_nightly_limit: 101,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message:
          'Não foi possível processar o seu pedido. Por favor tente novamente.',
      });
    });

    it('TC0017 - Should fail with user max amount daily is biggest than max amount daily', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        'LimitType',
        { tag: 'PIXCHANGE' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>('GlobalLimit', {
        limitTypeId: limitType.id,
        maxAmountDaily: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_max_amount_daily: 2000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message:
          'Não foi possível processar o seu pedido. Por favor tente novamente.',
      });
    });

    it('TC0018 - Should fail with user max amount nightly is biggest than max amount nightly', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        'LimitType',
        { tag: 'PIXCHANGE' },
      );

      await GlobalLimitFactory.create<GlobalLimitModel>('GlobalLimit', {
        limitTypeId: limitType.id,
        maxAmountNightly: 1000,
      });

      const res = await request(app.getHttpServer())
        .patch('/user/limits')
        .send({
          limit_types_ids: [limitType.id],
          user_max_amount_nightly: 2000,
        })
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message:
          'Não foi possível processar o seu pedido. Por favor tente novamente.',
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
