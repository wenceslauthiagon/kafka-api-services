import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from '@zro/common';
import { NotifyRefundModel } from '@zro/api-topazio/infrastructure';
import { NotifyRefundFactory } from '@zro/test/api-topazio/config';

describe('NotifyRefundModel', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: ['.api-topazio.env'] }),
        DatabaseModule.forFeature([NotifyRefundModel]),
      ],
    }).compile();
  });

  it('TC0001 - module should be defined', () => {
    expect(module).toBeDefined();
  });

  it('TC0002 - props should be defined', async () => {
    const notifyRefund = await NotifyRefundFactory.create<NotifyRefundModel>(
      NotifyRefundModel.name,
    );

    expect(notifyRefund).toBeDefined();
    expect(notifyRefund.id).toBeDefined();
    expect(notifyRefund.solicitationId).toBeDefined();
    expect(notifyRefund.contested).toBeDefined();
    expect(notifyRefund.endToEndId).toBeDefined();
    expect(notifyRefund.infractionId).toBeDefined();
    expect(notifyRefund.devolutionId).toBeDefined();
    expect(notifyRefund.refundReason).toBeDefined();
    expect(notifyRefund.refundAmount).toBeDefined();
    expect(notifyRefund.refundDetails).toBeDefined();
    expect(notifyRefund.status).toBeDefined();
    expect(notifyRefund.requesterIspb).toBeDefined();
    expect(notifyRefund.responderIspb).toBeDefined();
    expect(notifyRefund.state).toBeDefined();
    expect(notifyRefund.creationDate).toBeDefined();
    expect(notifyRefund.lastChangeDate).toBeDefined();
    expect(notifyRefund.createdAt).toBeDefined();
    expect(notifyRefund.updatedAt).toBeDefined();
  });

  afterAll(async () => {
    await module.close();
  });
});
