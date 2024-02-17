import {
  HandleEmailCreatedUseCase,
  SmtpGateway,
} from '@zro/notifications/application';
import { Email, EmailRepository } from '@zro/notifications/domain';
import { Logger } from 'winston';
import {
  EmailEventEmitterController,
  EmailEventEmitterControllerImpl,
} from '@zro/notifications/interface';

/**
 * Create an output DTO.
 *
 * @param email The e-mail.
 * @returns Send e-mail data.
 */
export function handleEmailCreatedPresenter(
  email: Email,
): HandleEmailCreatedResponse {
  if (!email) return null;

  const response: HandleEmailCreatedResponse = {
    id: email.id,
    to: email.to,
    from: email.from,
    state: email.state,
  };

  return response;
}

export type HandleEmailCreatedResponse = Pick<
  Email,
  'id' | 'to' | 'from' | 'state'
>;

export class HandleEmailCreatedController {
  /**
   * Local logger instance.
   */
  private logger: Logger;

  /**
   * Send e-mail use case.
   */
  private usecase: HandleEmailCreatedUseCase;

  /**
   * E-mail event used by use case.
   */
  private emailEventEmitter: EmailEventEmitterControllerImpl;

  /**
   * Default constructor.
   * @param logger System logger.
   * @param emailRepository E-mail repository.
   * @param emailEventEmitter E-mail event emitter.
   * @param smtpGateway Smtp gateway.
   * @param logger Global logger.
   */
  constructor(
    private readonly emailRepository: EmailRepository,
    private readonly emailEventEmitterController: EmailEventEmitterController,
    private readonly smtpGateway: SmtpGateway,
    logger: Logger,
  ) {
    this.logger = logger.child({ context: HandleEmailCreatedController.name });

    this.emailEventEmitter = new EmailEventEmitterControllerImpl(
      this.emailEventEmitterController,
    );

    this.usecase = new HandleEmailCreatedUseCase(
      this.emailRepository,
      this.emailEventEmitter,
      this.smtpGateway,
      this.logger,
    );
  }

  /**
   * Send created e-mail via SMTP.
   * @param id E-mail ID.
   * @returns Sent e-mail.
   */
  async execute(id: string): Promise<HandleEmailCreatedResponse> {
    // Send e-mail via SMTP.
    const email = await this.usecase.execute(id);

    return handleEmailCreatedPresenter(email);
  }
}
