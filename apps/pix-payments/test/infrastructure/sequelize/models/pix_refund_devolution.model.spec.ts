import { Test, TestingModule } from '@nestjs/testing';
import { PixRefundDevolutionModel } from '@zro/pix-payments/infrastructure';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixRefundDevolutionFactory } from '@zro/test/pix-payments/config';

describe('PixRefundDevolutionModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const refundDevolution =
      await PixRefundDevolutionFactory.create<PixRefundDevolutionModel>(
        PixRefundDevolutionModel.name,
      );

    expect(refundDevolution).toBeDefined();
    expect(refundDevolution.id).toBeDefined();
    expect(refundDevolution.userId).toBeDefined();
    expect(refundDevolution.operationId).toBeDefined();
    expect(refundDevolution.transactionId).toBeDefined();
    expect(refundDevolution.description).toBeDefined();
    expect(refundDevolution.devolutionCode).toBeDefined();
    expect(refundDevolution.failedMessage).toBeDefined();
    expect(refundDevolution.amount).toBeDefined();
    expect(refundDevolution.state).toBeDefined();
    expect(refundDevolution.createdAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
