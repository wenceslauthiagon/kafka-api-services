import { v4 as uuidV4 } from 'uuid';
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ExceptionTypes } from '@zro/common';
import { AppModule as ApiAdminAppModule } from '@zro/api-admin/infrastructure/nest/modules/app.module';
import { AppModule as StorageAppModule } from '@zro/storage/infrastructure/nest/modules/app.module';
import { AppModule as AdminAppModule } from '@zro/admin/infrastructure/nest/modules/app.module';
import { AccessTokenProvider } from '@zro/api-admin/infrastructure';
import { createAdminAndToken, initAppE2E } from '@zro/test/api-admin/utils';
import { FileFactory } from '@zro/test/storage/config';
import { FileModel } from '@zro/storage/infrastructure';

jest.setTimeout(30000);

describe('GetFileByIdRestController (e2e)', () => {
  let app: INestApplication;
  let tokenProvider: AccessTokenProvider;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ApiAdminAppModule, AdminAppModule, StorageAppModule],
    }).compile();

    app = await initAppE2E(module);
    tokenProvider = module.get<AccessTokenProvider>(AccessTokenProvider);
  });

  describe('/storage/files/:id (GET)', () => {
    it('TC0001 - Should get a file by id successfully', async () => {
      const { token } = await createAdminAndToken(tokenProvider);

      const { id } = await FileFactory.create<FileModel>(FileModel.name);

      const res = await request(app.getHttpServer())
        .get(`/storage/files/${id}`)
        .set('Authorization', token);

      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toBeDefined();
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.file_name).toBeDefined();
      expect(res.body.data.created_at).toBeDefined();
    });

    it('TC0002 - Should fail with invalid access token', async () => {
      const res = await request(app.getHttpServer())
        .get(`/storage/files/${uuidV4()}`)
        .set('Authorization', 'token');

      expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
      expect(res.body).toMatchObject({
        success: false,
        data: null,
        error: ExceptionTypes.USER,
        message: 'Acesso não autorizado.',
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
