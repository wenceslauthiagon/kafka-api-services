import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@zro/reports/infrastructure/nest/modules/app.module';
import { ReportUserConfigModel } from '@zro/reports/infrastructure';
import { ReportUserConfigFactory } from '@zro/test/reports/config';

describe('ReportUserConfigModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const reportConfig =
      await ReportUserConfigFactory.create<ReportUserConfigModel>(
        ReportUserConfigModel.name,
      );

    expect(reportConfig.id).toBeDefined();
    expect(reportConfig.type).toBeDefined();
    expect(reportConfig.description).toBeDefined();
    expect(reportConfig.typeConfig).toBeDefined();
    expect(reportConfig.createdAt).toBeDefined();
    expect(reportConfig.updatedAt).toBeDefined();
  });

  afterAll(() => module.close());
});
