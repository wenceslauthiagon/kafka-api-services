import { Test, TestingModule } from '@nestjs/testing';
import { PixFraudDetectionModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixFraudDetectionFactory } from '@zro/test/pix-payments/config';

describe('PixFraudDetectionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const pixFraudDetection =
      await PixFraudDetectionFactory.create<PixFraudDetectionModel>(
        PixFraudDetectionModel.name,
      );

    expect(pixFraudDetection).toBeDefined();
    expect(pixFraudDetection.id).toBeDefined();
    expect(pixFraudDetection.externalId).toBeDefined();
    expect(pixFraudDetection.personType).toBeDefined();
    expect(pixFraudDetection.document).toBeDefined();
    expect(pixFraudDetection.fraudType).toBeDefined();
    expect(pixFraudDetection.key).toBeDefined();
    expect(pixFraudDetection.status).toBeDefined();
    expect(pixFraudDetection.state).toBeDefined();
    expect(pixFraudDetection.status).toBeDefined();
    expect(pixFraudDetection.state).toBeDefined();
    expect(pixFraudDetection.createdAt).toBeDefined();
    expect(pixFraudDetection.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
