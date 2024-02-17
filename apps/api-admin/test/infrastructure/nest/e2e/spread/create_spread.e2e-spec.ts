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

  describe('/quotations/spreads (POST)', () => {
    it('TC0001 - Should post successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const payload = {
        sourceSymbol: faker.datatype.string(10),
        targetSymbol: faker.finance.currencySymbol(),
        providerTag: faker.finance.currencySymbol(),
        items: [
          {
            buy: faker.datatype.float(2),
            sell: faker.datatype.float(2),
            amount: faker.datatype.float(2),
          },
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/quotations/spreads')
        .send(payload)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.CREATED);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      res.body.data.forEach((res) => {
        expect(res.id).toBeDefined();
        expect(res.buy).toBe(payload.items[0].buy);
        expect(res.sell).toBe(payload.items[0].sell);
        expect(res.amount).toBe(payload.items[0].amount);
        expect(res.provider_id).toBeDefined();
        expect(res.provider_tag).toBe(payload.providerTag);
        expect(res.source_id).toBeDefined();
        expect(res.source_symbol).toBe(payload.sourceSymbol);
        expect(res.target_id).toBeDefined();
        expect(res.target_symbol).toBe(payload.targetSymbol);
        expect(res.created_at).toBeDefined();
      });
    });

    it('TC0002 - Should fail with invalid type', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const res = await request(app.getHttpServer())
        .post('/quotations/spreads')
        .send({ sell: 'x' })
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
