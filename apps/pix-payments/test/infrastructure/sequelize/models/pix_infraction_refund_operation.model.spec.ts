import { Test, TestingModule } from '@nestjs/testing';
import { PixInfractionRefundOperationModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixInfractionRefundOperationFactory } from '@zro/test/pix-payments/config';

describe('pixInfractionRefundOperationModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const pixInfractionRefundOperation =
      await PixInfractionRefundOperationFactory.create<PixInfractionRefundOperationModel>(
        PixInfractionRefundOperationModel.name,
      );

    expect(pixInfractionRefundOperation).toBeDefined();
    expect(pixInfractionRefundOperation.id).toBeDefined();
    expect(pixInfractionRefundOperation.state).toBeDefined();
    expect(pixInfractionRefundOperation.createdAt).toBeDefined();
    expect(pixInfractionRefundOperation.updatedAt).toBeDefined();
    expect(pixInfractionRefundOperation.userId).toBeDefined();
    expect(pixInfractionRefundOperation.pixInfractionId).toBeDefined();
    expect(pixInfractionRefundOperation.originalOperationId).toBeDefined();
    expect(pixInfractionRefundOperation.originalOperationValue).toBeDefined();
    expect(pixInfractionRefundOperation.refundOperationId).toBeDefined();
    expect(pixInfractionRefundOperation.refundOperationValue).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
