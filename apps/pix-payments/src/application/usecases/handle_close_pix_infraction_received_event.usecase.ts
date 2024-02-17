import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import {
  PixInfraction,
  PixInfractionRepository,
  PixInfractionState,
  PixInfractionStatus,
  PixInfractionAnalysisResultType,
} from '@zro/pix-payments/domain';
import {
  PixInfractionNotFoundException,
  PixInfractionEventEmitter,
} from '@zro/pix-payments/application';

export class HandleClosePixInfractionReceivedEventUseCase {
  /**
   * Default constructor.
   * @param logger Global logger instance.
   * @param infractionRepository Infraction repository.
   * @param eventEmitter Infraction event emitter.
   */
  constructor(
    private logger: Logger,
    private readonly infractionRepository: PixInfractionRepository,
    private readonly eventEmitter: PixInfractionEventEmitter,
  ) {
    this.logger = logger.child({
      context: HandleClosePixInfractionReceivedEventUseCase.name,
    });
  }

  /**
   * Close pix infraction that was received by PSPGateway.
   *
   * @param infractionPspId issue id.
   * @param analysisResult Result of psp analysis.
   * @returns infraction updated.
   * @throws {MissingDataException} Thrown when any required params are missing.
   * @throws {InfractionNotFoundException} Thrown when infraction id was not found.
   */
  async execute(
    infractionPspId: string,
    analysisResult: PixInfractionAnalysisResultType,
    analysisDetails: string,
  ): Promise<PixInfraction> {
    // Data input check

    if (!infractionPspId || !analysisResult) {
      throw new MissingDataException([
        ...(!infractionPspId ? ['Infraction ID'] : []),
        ...(!analysisResult ? ['Analysis Result'] : []),
      ]);
    }

    const infraction =
      await this.infractionRepository.getByInfractionPspId(infractionPspId);

    this.logger.debug('Infraction found.', { infraction });

    if (!infraction) {
      throw new PixInfractionNotFoundException({ infractionPspId });
    }

    // Indepotent
    if (
      infraction.state === PixInfractionState.CLOSED_PENDING ||
      infraction.state === PixInfractionState.CLOSED_CONFIRMED
    ) {
      return infraction;
    }

    infraction.status = PixInfractionStatus.CLOSED;
    infraction.state = PixInfractionState.CLOSED_PENDING;
    infraction.analysisResult = analysisResult;
    infraction.analysisDetails = analysisDetails;

    await this.infractionRepository.update(infraction);

    this.logger.debug(
      'Updated infraction with pending state and closed status.',
      { infraction },
    );

    this.eventEmitter.closedPendingInfractionReceived(infraction);

    return infraction;
  }
}
