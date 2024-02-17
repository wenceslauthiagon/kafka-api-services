import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
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

describe('GetUserLimitsByFilterController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiUsersAppModule, UsersAppModule, OperationsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/user/limits (GET)', () => {
    it('TC0001 - Should get user limits successfully', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      const limitType = await LimitTypeFactory.create<LimitTypeModel>(
        LimitTypeModel.name,
      );

      await GlobalLimitFactory.create<GlobalLimitModel>(GlobalLimitModel.name, {
        limitTypeId: limitType.id,
      });

      const res = await request(app.getHttpServer())
        .get('/user/limits')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBe(limitType.id);
        expect(res.limit_type_tag).toBeDefined();
        expect(res.limit_type_description).toBeDefined();
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
        expect(res.nighttime_end).toBeDefined();
        expect(res.nighttime_start).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
