import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { UserFactory } from '@zro/test/users/config';
import { UserModel } from '@zro/users/infrastructure';

jest.setTimeout(30000);

describe('GetUserLimitsByFilterController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ApiAdminAppModule,
        AdminAppModule,
        UsersAppModule,
        OperationsAppModule,
      ],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/user/limits (GET)', () => {
    it('TC0001 - Should get user limits successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const user = await UserFactory.create<UserModel>(UserModel.name);

      const res = await request(app.getHttpServer())
        .get(`/operatios/user_limits?user_id=${user.uuid}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.limit_type_id).toBeDefined();
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
