import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportUserLegalRepresentorModel } from '@zro/reports/infrastructure';
import { ReportUserLegalRepresentorFactory } from '@zro/test/reports/config';

describe('ReportUserLegalRepresentorModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const report =
      await ReportUserLegalRepresentorFactory.create<ReportUserLegalRepresentorModel>(
        ReportUserLegalRepresentorModel.name,
      );

    expect(report.id).toBeDefined();
    expect(report.userLegalRepresentorId).toBeDefined();
    expect(report.createdAt).toBeDefined();
    expect(report.updatedAt).toBeDefined();
  });

  afterAll(() => module.close());
});
