import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { AppModule as ApiUsersAppModule } from '@zro/api-users/infrastructure/nest/modules/app.module';
import { AppModule as UsersAppModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-users/infrastructure';
import { createUserAndToken, initAppE2E } from '@zro/test/api-users/utils';
import { LimitTypeFactory } from '@zro/test/operations/config';
import { LimitTypeModel } from '@zro/operations/infrastructure';

jest.setTimeout(30000);

describe('GetLimitTypesByFilterController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiUsersAppModule, UsersAppModule, OperationsAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/limits_type (GET)', () => {
    it('TC0001 - Should get limit types successfully', async () => {
      const { token } = await createUserAndToken(tokenProvider);

      await LimitTypeFactory.createMany<LimitTypeModel>(LimitTypeModel.name, 5);

      const res = await request(app.getHttpServer())
        .get('/limit_type')
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.page).toBeDefined();
      expect(res.body.data.page_size).toBeDefined();
      expect(res.body.data.total).toBeDefined();
      expect(res.body.data.page_total).toBe(
        Math.ceil(res.body.data.total / res.body.data.page_size),
      );
      res.body.data.data.forEach((res) => {
        expect(res).toBeDefined();
        expect(res.id).toBeDefined();
        expect(res.tag).toBeDefined();
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
