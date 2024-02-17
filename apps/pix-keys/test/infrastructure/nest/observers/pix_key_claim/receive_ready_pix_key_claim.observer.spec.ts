import { createMock } from 'ts-auto-mock';
import { KafkaContext } from '@nestjs/microservices';
import { Test, TestingModule } from '@nestjs/testing';
import { defaultLogger as logger, KafkaService } from '@zro/common';
import {
  ClaimStatusType,
  ClaimType,
  KeyState,
  PixKeyClaimEntity,
  PixKeyClaimRepository,
  PixKeyRepository,
} from '@zro/pix-keys/domain';
import {
  InvalidPixKeyClaimFlowException,
  PixKeyGateway,
  PixKeyNotFoundException,
} from '@zro/pix-keys/application';
import {
  ConfirmPortabilityClaimProcessController,
  CancelPortabilityClaimProcessController,
  CompletePortabilityClaimProcessController,
  WaitOwnershipClaimProcessController,
  ConfirmOwnershipClaimProcessController,
  CancelOwnershipClaimProcessController,
  CompleteOwnershipClaimProcessController,
  ReadyOwnershipClaimProcessController,
  ReadyPortabilityClaimProcessController,
  CompleteClosingClaimProcessController,
  HandleReceiveReadyPixKeyClaimEventRequest,
  PixKeyEventEmitterControllerInterface,
} from '@zro/pix-keys/interface';
import {
  PixKeyModel,
  ReceiveReadyPixKeyClaimNestObserver as Controller,
  PixKeyClaimModel,
  PixKeyDatabaseRepository,
  PixKeyClaimDatabaseRepository,
} from '@zro/pix-keys/infrastructure';
import { AppModule } from '@zro/pix-keys/infrastructure/nest/modules/app.module';
import { PixKeyClaimFactory, PixKeyFactory } from '@zro/test/pix-keys/config';

describe('ReceiveReadyPixKeyClaimNestObserver', () => {
  let module: TestingModule;
  let controller: Controller;
  let pixKeyRepository: PixKeyRepository;
  let pixKeyClaimRepository: PixKeyClaimRepository;

  const pixKeyEventService: PixKeyEventEmitterControllerInterface =
    createMock<PixKeyEventEmitterControllerInterface>();
  const kafkaService: KafkaService = createMock<KafkaService>();
  const ctx: KafkaContext = createMock<KafkaContext>();
  const mockPixKeyGateway: PixKeyGateway = createMock<PixKeyGateway>();

  const makeController = () => {
    const mockConfirmPortabilityClaimProcessController = jest
      .spyOn(ConfirmPortabilityClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockCancelPortabilityClaimProcessController = jest
      .spyOn(CancelPortabilityClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockCompletePortabilityClaimProcessController = jest
      .spyOn(CompletePortabilityClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockWaitOwnershipClaimProcessController = jest
      .spyOn(WaitOwnershipClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockConfirmOwnershipClaimProcessController = jest
      .spyOn(ConfirmOwnershipClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockCancelOwnershipClaimProcessController = jest
      .spyOn(CancelOwnershipClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockCompleteOwnershipClaimProcessController = jest
      .spyOn(CompleteOwnershipClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockReadyOwnershipClaimProcessController = jest
      .spyOn(ReadyOwnershipClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockReadyPortabilityClaimProcessController = jest
      .spyOn(ReadyPortabilityClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());
    const mockCompleteClosingClaimProcessController = jest
      .spyOn(CompleteClosingClaimProcessController.prototype, 'execute')
      .mockImplementation(jest.fn());

    return {
      mockConfirmPortabilityClaimProcessController,
      mockCancelPortabilityClaimProcessController,
      mockCompletePortabilityClaimProcessController,
      mockWaitOwnershipClaimProcessController,
      mockConfirmOwnershipClaimProcessController,
      mockCancelOwnershipClaimProcessController,
      mockCompleteOwnershipClaimProcessController,
      mockReadyOwnershipClaimProcessController,
      mockReadyPortabilityClaimProcessController,
      mockCompleteClosingClaimProcessController,
    };
  };

  const expectNotCallAController = () => {
    const {
      mockConfirmPortabilityClaimProcessController,
      mockCancelPortabilityClaimProcessController,
      mockCompletePortabilityClaimProcessController,
      mockWaitOwnershipClaimProcessController,
      mockConfirmOwnershipClaimProcessController,
      mockCancelOwnershipClaimProcessController,
      mockCompleteOwnershipClaimProcessController,
      mockReadyOwnershipClaimProcessController,
      mockReadyPortabilityClaimProcessController,
      mockCompleteClosingClaimProcessController,
    } = makeController();

    expect(mockConfirmPortabilityClaimProcessController).toHaveBeenCalledTimes(
      0,
    );
    expect(mockCancelPortabilityClaimProcessController).toHaveBeenCalledTimes(
      0,
    );
    expect(mockCompletePortabilityClaimProcessController).toHaveBeenCalledTimes(
      0,
    );
    expect(mockWaitOwnershipClaimProcessController).toHaveBeenCalledTimes(0);
    expect(mockConfirmOwnershipClaimProcessController).toHaveBeenCalledTimes(0);
    expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledTimes(0);
    expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledTimes(
      0,
    );
    expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(0);
    expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(0);
    expect(mockCompleteClosingClaimProcessController).toHaveBeenCalledTimes(0);
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(KafkaService)
      .useValue(kafkaService)
      .compile();
    controller = module.get<Controller>(Controller);
    pixKeyRepository = new PixKeyDatabaseRepository();
    pixKeyClaimRepository = new PixKeyClaimDatabaseRepository();
  });

  beforeEach(() => jest.resetAllMocks());

  describe('With valid parameters', () => {
    it('TC0001 - Should create PixKeyClaim successfully when not found', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const { mockConfirmPortabilityClaimProcessController } = makeController();

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(
        mockConfirmPortabilityClaimProcessController,
      ).toHaveBeenCalledTimes(1);
      expect(mockConfirmPortabilityClaimProcessController).toHaveBeenCalledWith(
        { key: pixKeyClaim.key },
      );
    });

    it('TC0002 - Should update PixKeyClaim successfully', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockConfirmPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(
        mockConfirmPortabilityClaimProcessController,
      ).toHaveBeenCalledTimes(1);
      expect(mockConfirmPortabilityClaimProcessController).toHaveBeenCalledWith(
        { key: pixKeyClaim.key },
      );
    });
  });

  describe('With invalid parameters', () => {
    it('TC0003 - Should not call a controller and not update claim if pix key is not found', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CANCELED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimEntity>(
        PixKeyClaimEntity.name,
        { key: pixKey.key },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(PixKeyNotFoundException);
      expectNotCallAController();
    });
  });

  describe('With PORTABILITY_STARTED state', () => {
    it('TC0004 - Should not call a controller and not update claim when claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0005 - Should Confirm Portability when claimStatus is CONFIRMED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const { mockConfirmPortabilityClaimProcessController } = makeController();

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(
        mockConfirmPortabilityClaimProcessController,
      ).toHaveBeenCalledTimes(1);
      expect(mockConfirmPortabilityClaimProcessController).toHaveBeenCalledWith(
        { key: pixKeyClaim.key },
      );
    });

    it('TC0006 - Should Cancel Portability when claimStatus is CANCELLED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const { mockCancelPortabilityClaimProcessController } = makeController();

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCancelPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCancelPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0007 - Should Complete Portability when claimStatus is COMPLETED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const { mockCompletePortabilityClaimProcessController } =
        makeController();

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(
        mockCompletePortabilityClaimProcessController,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCompletePortabilityClaimProcessController,
      ).toHaveBeenCalledWith({ key: pixKeyClaim.key });
    });

    it('TC0008 - Should not call a controller and not update claim when claimStatus is WAITING_RESOLUTION and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });
  });

  describe('With PORTABILITY_CONFIRMED state', () => {
    it('TC0009 - Should not call a controller and not update claim when claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0010 - Should not call a controller and update claim when claimStatus is CONFIRMED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      expectNotCallAController();
    });

    it('TC0011 - Should Cancel Portability when claimStatus is CANCELLED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCancelPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCancelPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCancelPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0012 - Should Complete Portability when claimStatus is COMPLETED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCompletePortabilityClaimProcessController } =
        makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(
        mockCompletePortabilityClaimProcessController,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockCompletePortabilityClaimProcessController,
      ).toHaveBeenCalledWith({ key: pixKeyClaim.key });
    });

    it('TC0013 - Should not call a controller and not update claim when claimStatus is WAITING_RESOLUTION and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });
  });

  describe('With OWNERSHIP_STARTED state', () => {
    it('TC0014 - Should not call a controller and not update claim when claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0015 - Should Wait Ownership when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockWaitOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockWaitOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockWaitOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0016 - Should Confirm Ownership when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockConfirmOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockConfirmOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockConfirmOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0017 - Should Cancel Ownership when claimStatus is CANCELLED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCancelOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0018 - Should Complete Ownership when claimStatus is COMPLETED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_STARTED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCompleteOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });
  });

  describe('With OWNERSHIP_WAITING state', () => {
    it('TC0019 - Should not call a controller and not update claim when claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_WAITING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0020 - Should Confirm Ownership when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_WAITING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockConfirmOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockConfirmOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockConfirmOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0021 - Should Cancel Ownership when claimStatus is CANCELLED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_WAITING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCancelOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0022 - Should Complete Ownership when claimStatus is COMPLETED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_WAITING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCompleteOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0023 - Should not call a controller and update claim when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_WAITING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      expectNotCallAController();
    });
  });

  describe('With OWNERSHIP_CONFIRMED state', () => {
    it('TC0024 - Should not call a controller and not update claim when claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0025 - Should Complete Ownership when claimStatus is COMPLETED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCompleteOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCompleteOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0026 - Should Cancel Ownership when claimStatus is CANCELLED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCancelOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCancelOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0027 - Should not call a controller and update claim when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      expectNotCallAController();
    });

    it('TC0028 - Should not call a controller and update claim when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_CONFIRMED,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      expectNotCallAController();
    });
  });

  describe('With READY state', () => {
    it('TC0029 - Should not call a controller and not update claim when claimStatus is COMPLETED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0030 - Should not call a controller and not update claim when claimStatus is CANCELLED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0031 - Should Ready Ownership when claimStatus is OPEN and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0032 - Should Ready Portability when claimStatus is OPEN and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0033 - Should Ready Ownership when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0034 - Should Ready Portability when claimStatus is WAITING_RESOLUTION and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0035 - Should Ready Ownership when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0036 - Should Ready Portability when claimStatus is CONFIRMED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });
  });

  describe('With ADD_KEY_READY state', () => {
    it('TC0037 - Should not call a controller and not update claim when claimStatus is COMPLETED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0038 - Should not call a controller and not update claim when claimStatus is CANCELLED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0039 - Should Ready Ownership when claimStatus is OPEN and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0040 - Should Ready Portability when claimStatus is OPEN and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0041 - Should Ready Ownership when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0042 - Should Ready Portability when claimStatus is WAITING_RESOLUTION and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0043 - Should Ready Ownership when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0044 - Should Ready Portability when claimStatus is CONFIRMED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.ADD_KEY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });
  });

  describe('With PORTABILITY_READY state', () => {
    it('TC0045 - Should not call a controller and not update claim when claimStatus is COMPLETED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0046 - Should not call a controller and not update claim when claimStatus is CANCELLED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0047 - Should Ready Ownership when claimStatus is OPEN and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0048 - Should Ready Portability when claimStatus is OPEN and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0049 - Should Ready Ownership when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0050 - Should Ready Portability when claimStatus is WAITING_RESOLUTION and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0051 - Should Ready Ownership when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0052 - Should Ready Portability when claimStatus is CONFIRMED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.PORTABILITY_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });
  });

  describe('With OWNERSHIP_READY state', () => {
    it('TC0053 - Should not call a controller and not update claim when claimStatus is COMPLETED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0054 - Should not call a controller and not update claim when claimStatus is CANCELLED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0055 - Should Ready Ownership when claimStatus is OPEN and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0056 - Should Ready Portability when claimStatus is OPEN and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.OPEN,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0057 - Should Ready Ownership when claimStatus is WAITING_RESOLUTION and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0058 - Should Ready Portability when claimStatus is WAITING_RESOLUTION and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.WAITING_RESOLUTION,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0059 - Should Ready Ownership when claimStatus is CONFIRMED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyOwnershipClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledTimes(1);
      expect(mockReadyOwnershipClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0060 - Should Ready Portability when claimStatus is CONFIRMED and claimType is Portability', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.OWNERSHIP_READY,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockReadyPortabilityClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockReadyPortabilityClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });
  });

  describe('With CLAIM_CLOSING state', () => {
    it('TC0061 - Should not call a controller and not update claim when claimStatus is CANCELLED', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CANCELLED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0062 - Should not call a controller and not update claim when claimType is PORTABILITY', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.PORTABILITY,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const testScript = () =>
        controller.execute(
          message,
          pixKeyRepository,
          pixKeyClaimRepository,
          pixKeyEventService,
          mockPixKeyGateway,
          logger,
          ctx,
        );

      await expect(testScript).rejects.toThrow(InvalidPixKeyClaimFlowException);
      expectNotCallAController();
    });

    it('TC0063 - Should Complete Closing when claimStatus is COMPLETED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.COMPLETED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      const { mockCompleteClosingClaimProcessController } = makeController();

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      const result = await PixKeyClaimModel.findOne({
        where: { id: pixKeyClaim.id },
      });

      expect(result).toBeDefined();
      expect(result.id).toBe(pixKeyClaim.id);
      expect(result.status).toBe(pixKeyClaim.status);
      expect(mockCompleteClosingClaimProcessController).toHaveBeenCalledTimes(
        1,
      );
      expect(mockCompleteClosingClaimProcessController).toHaveBeenCalledWith({
        key: pixKeyClaim.key,
      });
    });

    it('TC0064 - Should not call a controller and update claim when claimStatus is not COMPLETED and claimType is Ownership', async () => {
      const pixKey = await PixKeyFactory.create<PixKeyModel>(PixKeyModel.name, {
        state: KeyState.CLAIM_CLOSING,
      });
      const pixKeyClaim = await PixKeyClaimFactory.create<PixKeyClaimModel>(
        PixKeyClaimModel.name,
        {
          key: pixKey.key,
          type: ClaimType.OWNERSHIP,
          status: ClaimStatusType.CONFIRMED,
        },
      );

      const message: HandleReceiveReadyPixKeyClaimEventRequest = {
        id: pixKeyClaim.id,
        key: pixKeyClaim.key,
        type: pixKeyClaim.type,
        status: pixKeyClaim.status,
      };

      await controller.execute(
        message,
        pixKeyRepository,
        pixKeyClaimRepository,
        pixKeyEventService,
        mockPixKeyGateway,
        logger,
        ctx,
      );

      expectNotCallAController();
    });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await module.close();
  });
});
