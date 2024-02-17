import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@zro/pix-payments/infrastructure/nest/modules/app.module';
import { PixRefundModel } from '@zro/pix-payments/infrastructure';
import { PixRefundFactory } from '@zro/test/pix-payments/config';

describe('RefundModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  });

  it('TC0001 - should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - should be created', async () => {
    const refund = await PixRefundFactory.create<PixRefundModel>(
      PixRefundModel.name,
    );

    expect(refund).toBeDefined();
    expect(refund.id).toBeDefined();
    expect(refund.solicitationPspId).toBeDefined();
    expect(refund.infractionId).toBeDefined();
    expect(refund.operationId).toBeDefined();
    expect(refund.transactionId).toBeDefined();
    expect(refund.transactionType).toBeDefined();
    expect(refund.issueId).toBeDefined();
    expect(refund.contested).toBeDefined();
    expect(refund.amount).toBeDefined();
    expect(refund.description).toBeDefined();
    expect(refund.reason).toBeDefined();
    expect(refund.requesterIspb).toBeDefined();
    expect(refund.responderIspb).toBeDefined();
    expect(refund.status).toBeDefined();
    expect(refund.state).toBeDefined();
    expect(refund.analysisDetails).toBeDefined();
    expect(refund.rejectionReason).toBeDefined();
    expect(refund.failedCode).toBeDefined();
    expect(refund.failedMessage).toBeDefined();
    expect(refund.createdAt).toBeDefined();
    expect(refund.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
