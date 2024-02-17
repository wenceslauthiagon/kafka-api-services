import * as request from 'supertest';
import { faker } from '@faker-js/faker/locale/pt_BR';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as QuotationsAppModule } from '@zro/quotations/infrastructure/nest/modules/app.module';
import { AppModule as OperationsAppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { AppModule as OtcAppModule } from '@zro/otc/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';

jest.setTimeout(30000);

describe('SpreadRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ApiAdminAppModule,
        AdminAppModule,
        QuotationsAppModule,
        OperationsAppModule,
        OtcAppModule,
      ],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/quotations/spreads (DELETE)', () => {
    it('TC0001 - Should delete successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const payload = {
        sourceSymbol: faker.datatype.string(10),
        targetSymbol: faker.finance.currencySymbol(),
        providerTag: faker.finance.currencySymbol(),
      };

      const res = await request(app.getHttpServer())
        .delete('/quotations/spreads')
        .send(payload)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
    });

    it('TC0002 - Should fail with invalid type', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .delete('/quotations/spreads')
        .send({ providerTag: 10 })
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
