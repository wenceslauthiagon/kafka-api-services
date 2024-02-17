import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as UserModule } from '@zro/users/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import {
  AccessTokenProvider,
  UpdateUserPropsBody,
} from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { UserFactory } from '@zro/test/users/config';
import { UserModel } from '@zro/users/infrastructure';

jest.setTimeout(30000);

describe('UpdateUserPropsRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, UserModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/user/props (PATCH)', () => {
    it('TC0001 - Should patch successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const user = await UserFactory.create<UserModel>(UserModel.name);

      const payload: UpdateUserPropsBody = {
        propKey: 'testKey',
        propValue: 'test value',
      };

      const res = await request(app.getHttpServer())
        .patch(`/user/${user.uuid}/props`)
        .send(payload)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      // expect(res.body.data).toBeDefined();
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
