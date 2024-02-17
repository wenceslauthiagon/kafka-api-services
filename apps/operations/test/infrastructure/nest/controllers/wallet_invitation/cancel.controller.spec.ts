import { v4 as uuidV4 } from 'uuid';
import { createMock } from 'ts-auto-mock';
import { Test, TestingModule } from '@nestjs/testing';
import {
  InvalidDataFormatException,
  defaultLogger as logger,
} from '@zro/common';
import {
  WalletInvitationRepository,
  WalletInvitationState,
} from '@zro/operations/domain';
import {
  CancelWalletInvitationMicroserviceController as Controller,
  WalletInvitationDatabaseRepository,
  WalletInvitationModel,
} from '@zro/operations/infrastructure';
import { AppModule } from '@zro/operations/infrastructure/nest/modules/app.module';
import { WalletInvitationFactory } from '@zro/test/operations/config';
import { KafkaContext } from '@nestjs/microservices';
import { CancelWalletInvitationRequest } from '@zro/operations/interface';

describe('CancelWalletInvitationMicroserviceController', () => {
  let module: TestingModule;
  let controller: Controller;
  let walletInvitationRepository: WalletInvitationRepository;

  const ctx: KafkaContext = createMock<KafkaContext>();

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    controller = module.get<Controller>(Controller);
    walletInvitationRepository = new WalletInvitationDatabaseRepository();
  });

  describe('CancelWalletInvitation', () => {
    describe('With invalid parameters', () => {
      it('TC0001 - Should not cancel with invalid parameters', async () => {
        const message: CancelWalletInvitationRequest = {
          id: uuidV4(),
          userId: null,
        };

        await expect(() =>
          controller.execute(walletInvitationRepository, logger, message, ctx),
        ).rejects.toThrow(InvalidDataFormatException);
      });
    });

    describe('With valid parameters', () => {
      it('TC0002 - Should cancel wallet invitation successfully', async () => {
        const walletInvitation =
          await WalletInvitationFactory.create<WalletInvitationModel>(
            WalletInvitationModel.name,
            { state: WalletInvitationState.PENDING },
          );

        const { id, email, userId, walletId } = walletInvitation;

        const message: CancelWalletInvitationRequest = {
          id: walletInvitation.id,
          userId,
        };

        const result = await controller.execute(
          walletInvitationRepository,
          logger,
          message,
          ctx,
        );

        expect(result).toBeDefined();
        expect(result.value.id).toBe(id);
        expect(result.value.email).toBe(email);
        expect(result.value.state).toBe(WalletInvitationState.CANCELED);
        expect(result.value.walletId).toBe(walletId);
        expect(result.value.permissionTypeTags).toHaveLength(1);
      });
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
