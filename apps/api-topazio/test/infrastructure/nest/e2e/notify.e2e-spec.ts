import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';

import { AppModule } from '@zro/api-topazio/infrastructure/nest/modules/app.module';

import {
  NotifyClaimFactory,
  NotifyCompletionFactory,
  NotifyCreditFactory,
  NotifyDebitFactory,
  NotifyInfractionFactory,
} from '@zro/test/api-topazio/config';
import {
  NotifyClaimEntity,
  NotifyCompletionEntity,
  NotifyCreditEntity,
  NotifyDebitEntity,
} from '@zro/api-topazio/domain';
import {
  NotifyClaimModel,
  NotifyCompletionModel,
  NotifyCreditModel,
  NotifyDebitModel,
  NotifyInfractionBody,
  NotifyInfractionModel,
} from '@zro/api-topazio/infrastructure';

describe('NotifyController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    await app.listen(appPort);
  });

  describe('With valid parameters', () => {
    it('TC0001 - /notify-credit (POST)', async () => {
      const data = await NotifyCreditFactory.create<NotifyCreditEntity>(
        NotifyCreditModel.name,
      );

      const res = await request(app.getHttpServer())
        .post('/notify-credit')
        .send(data);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body).toMatchObject({});
    });

    it('TC0002 - /notify-debit (POST)', async () => {
      const data = await NotifyDebitFactory.create<NotifyDebitEntity>(
        NotifyDebitModel.name,
      );

      const res = await request(app.getHttpServer())
        .post('/notify-debit')
        .send(data);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body).toMatchObject({});
    });

    it('TC0003 - /notify-completion (POST)', async () => {
      const data = await NotifyCompletionFactory.create<NotifyCompletionEntity>(
        NotifyCompletionModel.name,
      );

      const res = await request(app.getHttpServer())
        .post('/notify-completion')
        .send(data);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body).toMatchObject({});
    });

    it('TC0004 - /notify-claims (POST)', async () => {
      const data = await NotifyClaimFactory.create<NotifyClaimEntity>(
        NotifyClaimModel.name,
      );

      const res = await request(app.getHttpServer())
        .post('/notify-claims')
        .send(data);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body).toMatchObject({});
    });

    it('TC0005 - /notify-infraction (POST)', async () => {
      const data = await NotifyInfractionFactory.create<NotifyInfractionBody>(
        NotifyInfractionModel.name,
      );

      const res = await request(app.getHttpServer())
        .post('/infractionreports')
        .send(data);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body).toMatchObject({});
    });
  });

  afterAll(() => app.close());
});
